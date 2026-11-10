const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// ---------------------------------------------------------------------------
// 0. Parse Catalog & Episodes directly from TypeScript data files
// ---------------------------------------------------------------------------
function loadTsExport(filePath, exportName) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const marker = `export const ${exportName}`;
    const idx = raw.indexOf(marker);
    if (idx === -1) return [];
    const eqIdx = raw.indexOf("=", idx);
    let body = raw.slice(eqIdx + 1).trim();
    // Strip TypeScript "as any" or type annotations inside literals
    body = body.replace(/\s+as\s+[A-Za-z0-9_[\]]+/g, "");
    if (body.endsWith(";")) body = body.slice(0, -1);
    return new Function(`return (${body});`)();
  } catch (e) {
    console.error(`[Loader Error] ${filePath}:`, e.message);
    return [];
  }
}

const CATALOG_DATA = loadTsExport(
  path.join(__dirname, "apps", "web", "src", "data", "catalog.ts"),
  "CATALOG"
);
const EPISODES_MAP = loadTsExport(
  path.join(__dirname, "apps", "web", "src", "data", "episodes.ts"),
  "EPISODES"
);

// ---------------------------------------------------------------------------
// 1. AI Orchestrator Microservice (Port 8000) - Built-in Node Server
// ---------------------------------------------------------------------------
function executeIngestMetadata(payload = {}) {
  const rawText = payload.raw_text || "";
  const url = payload.url || "";
  const isSteins =
    rawText.toLowerCase().includes("steins") ||
    url.toLowerCase().includes("steins");
  const title = isSteins ? "Steins;Gate" : "Anime Titulo Detectado";
  const genres = isSteins
    ? ["Sci-Fi", "Suspenso", "Drama"]
    : ["Acción", "Fantasía"];
  return {
    status: "success",
    skill: "skill-ingest-metadata",
    data: {
      title,
      synopsis: rawText
        ? rawText.slice(0, 200)
        : `Contenido extraído de ${url}`,
      genres,
      release_year: 2011,
      cast: ["Mamoru Miyano", "Asami Imai", "Kana Hanazawa"],
    },
  };
}

function executeDetectIntroOutro(payload = {}) {
  const source = payload.video_path || payload.hls_url || "";
  return {
    status: "success",
    skill: "skill-detect-intro-outro",
    data: {
      source,
      intro_start_sec: 5,
      intro_end_sec: 25,
      outro_start_sec: 1320,
      outro_end_sec: 1410,
    },
  };
}

function executeAutoSubtitleSync(payload = {}) {
  const targetLang = payload.target_lang || "es";
  return {
    status: "success",
    skill: "skill-auto-subtitle-sync",
    data: {
      language: targetLang,
      vtt_content:
        "WEBVTT - Subtitulos traducidos por Platform-X AI\n\n1\n00:00:01.000 --> 00:00:04.000\nKore wa mirai no monogatari da.\n\n2\n00:00:05.000 --> 00:00:09.000\nBienvenido a Platform-X Anime.\n",
      format: "WebVTT",
    },
  };
}

function executeSemanticSearch(payload = {}) {
  const query = (payload.query || "").toLowerCase();
  const topK = payload.top_k || 3;

  const scored = CATALOG_DATA.map((a) => {
    let score = 0.78;
    const text = `${a.title} ${a.synopsis} ${(a.genres || []).join(" ")}`.toLowerCase();
    const words = query.split(/\s+/).filter((w) => w.length > 2);
    for (const w of words) {
      if (text.includes(w)) score += 0.06;
    }
    return {
      anime_id: a.id,
      title: a.title,
      match_score: Math.min(0.98, Number(score.toFixed(2))),
      reason: `${(a.genres || []).slice(0, 3).join(", ")} · ${(a.synopsis || "").slice(0, 75)}...`,
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const matches = scored.length > 0 ? scored.slice(0, topK) : [
    { anime_id: "airing-01", title: "Dandadan", match_score: 0.95, reason: "Acción paranormal, comedia y romance" },
    { anime_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e", title: "Frieren: Beyond Journey's End", match_score: 0.92, reason: "Fantasía épica y viaje emotivo" },
    { anime_id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", title: "Steins;Gate", match_score: 0.89, reason: "Viajes en el tiempo y suspenso" },
  ];

  return {
    status: "success",
    skill: "skill-semantic-search",
    query: payload.query || "",
    data: { matches },
  };
}

function executeContentModeration(payload = {}) {
  const text = payload.comment_text || "";
  const spoilerKeywords = ["muere", "final", "villano es", "traidor", "se muere", "asesina"];
  const profanity = ["insulto_feo", "palabrota", "idiota", "estupido"];

  for (const p of profanity) {
    if (text.toLowerCase().includes(p)) {
      return {
        status: "success",
        skill: "skill-content-moderation",
        data: {
          action: "blocked",
          reason: "Lenguaje ofensivo detectado",
          processed_text: null,
        },
      };
    }
  }

  let action = "approved";
  let processedText = text;
  for (const key of spoilerKeywords) {
    if (text.toLowerCase().includes(key) && !text.includes("<spoiler>")) {
      action = "tagged_spoiler";
      processedText = `<spoiler>${text}</spoiler>`;
      break;
    }
  }

  return {
    status: "success",
    skill: "skill-content-moderation",
    data: { action, processed_text: processedText },
  };
}

function dispatchAiPost(urlPath, payload) {
  if (urlPath === "/skills/ingest-metadata") return executeIngestMetadata(payload);
  if (urlPath === "/skills/detect-intro-outro") return executeDetectIntroOutro(payload);
  if (urlPath === "/skills/auto-subtitle-sync") return executeAutoSubtitleSync(payload);
  if (urlPath === "/skills/semantic-search") return executeSemanticSearch(payload);
  if (urlPath === "/skills/content-moderation") return executeContentModeration(payload);

  if (urlPath === "/agents/otaku-copilot") {
    const userQuery = payload.query || "";
    const matches = executeSemanticSearch({ query: userQuery, top_k: 3 }).data.matches;
    const topPick = matches[0];
    const summary = matches.map((m) => `**${m.title}**`).join(", ");
    const reply = `¡Hola! Según lo que buscas (*"${userQuery}"*), mi principal recomendación es **${topPick.title}** (${Math.round(topPick.match_score * 100)}% de afinidad). También te sugiero ver el tráiler y avances de: ${summary}.`;
    return {
      success: true,
      data: {
        agent: "OtakuCopilot",
        query: userQuery,
        reply,
        recommendations: matches,
        confidence: topPick.match_score,
      },
    };
  }

  if (urlPath === "/agents/moderate-comment") {
    const commentText = payload.comment_text || "";
    const mod = executeContentModeration({ comment_text: commentText }).data;
    const badges = {
      approved: "Limpio",
      tagged_spoiler: "Spoiler Oculto ⚠️",
      blocked: "Bloqueado 🚫",
    };
    return {
      success: true,
      data: {
        agent: "CommunityGovernanceAgent",
        status: mod.action,
        processed_text: mod.processed_text,
        badge: badges[mod.action] || "Revisión",
        reason:
          mod.reason ||
          (mod.action === "tagged_spoiler"
            ? "Spoiler etiquetado automáticamente"
            : "Comentario aprobado"),
      },
    };
  }

  return null;
}

function sendJson(res, status, data) {
  const body = Buffer.from(JSON.stringify(data), "utf8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  });
  res.end(body);
}

const aiServer = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 200, { status: "ok" });
  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, {
      status: "ok",
      service: "ai-orchestrator",
      loaded_skills: [
        "ingest-metadata",
        "detect-intro-outro",
        "auto-subtitle-sync",
        "semantic-search",
        "content-moderation",
      ],
      active_agents: [
        "ContentProcessingAgent",
        "OtakuCopilotAgent",
        "CommunityGovernanceAgent",
      ],
    });
  }

  if (req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        const payload = raw ? JSON.parse(raw) : {};
        const result = dispatchAiPost(req.url, payload);
        if (result) return sendJson(res, 200, result);
        return sendJson(res, 404, { error: `Endpoint ${req.url} not found` });
      } catch (e) {
        return sendJson(res, 400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

aiServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log("[Platform-X AI Orchestrator] port 8000 already active.");
  } else {
    console.error("[Platform-X AI Orchestrator] error:", err.message);
  }
});

aiServer.listen(8000, () => {
  console.log("[Platform-X AI Orchestrator] running on http://localhost:8000");
});

// ---------------------------------------------------------------------------
// 2. Backend API Server (Port 4000) - Zero-Dependency Built-in Node Server
// ---------------------------------------------------------------------------
const watchHistoryStore = [];
const commentsStore = [
  {
    id: "c1",
    episodeId: "dandadan-ep1",
    userId: "u1",
    userName: "OkarunFan",
    originalText: "¡El tráiler oficial de Science SARU y el avance del episodio 1 son espectaculares!",
    processedText: "¡El tráiler oficial de Science SARU y el avance del episodio 1 son espectaculares!",
    status: "approved",
    badge: "Limpio",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "c2",
    episodeId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    userId: "u2",
    userName: "OkabeRintaro",
    originalText: "¡El Psy Kongroo! La trama es simplemente brillante.",
    processedText: "¡El Psy Kongroo! La trama es simplemente brillante.",
    status: "approved",
    badge: "Limpio",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "c3",
    episodeId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    userId: "u3",
    userName: "AnimeFan99",
    originalText: "Increíble cómo muere el personaje en la azotea al final.",
    processedText: "<spoiler>Increíble cómo muere el personaje en la azotea al final.</spoiler>",
    status: "tagged_spoiler",
    badge: "Spoiler Oculto ⚠️",
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
];

const apiServer = http.createServer((req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 200, { status: "ok" });

  const urlObj = new URL(req.url, "http://localhost:4000");
  const pathname = urlObj.pathname;

  if (req.method === "GET" && pathname === "/health") {
    return sendJson(res, 200, { status: "ok", service: "platform-x-api" });
  }

  if (req.method === "GET" && pathname === "/api/animes") {
    return sendJson(res, 200, { source: "database", data: CATALOG_DATA });
  }

  if (req.method === "GET" && pathname.startsWith("/api/animes/")) {
    const id = pathname.replace("/api/animes/", "");
    const anime = CATALOG_DATA.find((a) => a.id === id);
    if (!anime) return sendJson(res, 404, { error: "Anime not found" });
    return sendJson(res, 200, { ...anime, episodes: EPISODES_MAP[id] || [] });
  }

  if (req.method === "GET" && pathname.startsWith("/api/comments/")) {
    const episodeId = pathname.replace("/api/comments/", "");
    const list = commentsStore.filter(
      (c) => (c.episodeId === episodeId || c.episodeId === "dandadan-ep1") && c.status !== "blocked"
    );
    return sendJson(res, 200, { count: list.length, data: list });
  }

  if (req.method === "POST" && pathname === "/api/comments") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const { episodeId, userId = "user_anon", userName = "UsuarioActual", commentText = "" } = body;
        const mod = dispatchAiPost("/agents/moderate-comment", { comment_text: commentText }).data;
        if (mod.status === "blocked") {
          return sendJson(res, 403, {
            error: "Comentario bloqueado por incumplimiento de normas comunitarias",
            reason: mod.reason,
          });
        }
        const newComment = {
          id: `c_${Date.now()}`,
          episodeId,
          userId,
          userName,
          originalText: commentText,
          processedText: mod.processed_text || commentText,
          status: mod.status || "approved",
          badge: mod.badge || "Limpio",
          createdAt: new Date().toISOString(),
        };
        commentsStore.unshift(newComment);
        return sendJson(res, 201, { success: true, comment: newComment });
      } catch (e) {
        return sendJson(res, 400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/history") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const record = {
          user_id: body.userId || "anon",
          episode_id: body.episodeId || "",
          stopped_at_sec: Number(body.stoppedAtSec || 0),
          completed: Boolean(body.completed),
          updated_at: new Date().toISOString(),
        };
        watchHistoryStore.unshift(record);
        return sendJson(res, 200, { success: true, data: record });
      } catch (e) {
        return sendJson(res, 400, { error: "Invalid JSON" });
      }
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

apiServer.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log("[Platform-X API] port 4000 already active.");
  } else {
    console.error("[Platform-X API] error:", err.message);
  }
});

apiServer.listen(4000, () => {
  console.log("[Platform-X API] running on http://localhost:4000");
});

// ---------------------------------------------------------------------------
// 3. Frontend Web Server (Port 3000) - Next.js or Built-in SPA Fallback
// ---------------------------------------------------------------------------
const webDir = path.join(__dirname, "apps", "web");
const nextBin = path.join(webDir, "node_modules", "next", "dist", "bin", "next");

if (fs.existsSync(nextBin)) {
  const nextProc = spawn(process.execPath, [nextBin, "dev", "-p", "3000"], {
    cwd: webDir,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    stdio: "inherit",
  });

  nextProc.on("exit", (code) => {
    process.exit(code || 0);
  });
} else {
  const publicDir = path.join(webDir, "public");
  const standaloneHtmlPath = path.join(publicDir, "standalone.html");

  const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };

  const webServer = http.createServer((req, res) => {
    const urlObj = new URL(req.url, "http://localhost:3000");
    let pathname = decodeURIComponent(urlObj.pathname);

    if (pathname === "/api/catalog-data.json") {
      return sendJson(res, 200, { catalog: CATALOG_DATA, episodes: EPISODES_MAP });
    }

    if (pathname === "/" || pathname === "/index.html") {
      if (fs.existsSync(standaloneHtmlPath)) {
        const html = fs.readFileSync(standaloneHtmlPath, "utf8");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(html);
      }
    }

    const filePath = path.join(publicDir, pathname);
    if (filePath.startsWith(publicDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || "application/octet-stream";
      const stat = fs.statSync(filePath);
      const range = req.headers.range;

      // Support HTTP Range requests for smooth MP4/WebM video seeking
      if (range && (ext === ".mp4" || ext === ".webm")) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": mime,
        });
        return file.pipe(res);
      }

      res.writeHead(200, {
        "Content-Type": mime,
        "Content-Length": stat.size,
        "Accept-Ranges": "bytes",
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  });

  webServer.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log("[Platform-X Web] port 3000 already active.");
    } else {
      console.error("[Platform-X Web] error:", err.message);
    }
  });

  webServer.listen(3000, () => {
    console.log("========================================================");
    console.log("  [Platform-X Web] running on http://localhost:3000");
    console.log("  Abre http://localhost:3000 en tu navegador");
    console.log("========================================================");
  });
}
