"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { AnimeCard } from "../components/AnimeCard";
import { VideoPlayer } from "../components/VideoPlayer";
import { CommentsSection } from "../components/CommentsSection";
import { OtakuCopilotChat } from "../components/OtakuCopilotChat";
import { CATALOG, CatalogAnime, AiringDay } from "../data/catalog";
import { EPISODES } from "../data/episodes";
import { Anime, Episode } from "../types";
import {
  Search, Sun, Moon, ChevronLeft, Filter, Sparkles,
  Radio, Calendar, Star, Clock, ChevronDown, ChevronUp,
  Tv, Film, Disc, X, Video, BookOpen, ExternalLink, Play,
} from "lucide-react";

// Fallback for any future catalog additions
CATALOG.forEach((a) => {
  if (!EPISODES[a.id]) {
    EPISODES[a.id] = [
      {
        id: `${a.id}-ep1`,
        anime_id: a.id,
        episode_number: 1,
        title: "Episodio 1 — Comienzo",
        synopsis: a.synopsis,
        video_url: a.trailer_url,
        youtube_preview_id: a.trailer_youtube_id,
        official_source: a.official_source,
        intro_start_sec: 5,
        intro_end_sec: 25,
        duration_sec: 1440,
      },
    ];
  }
});

// ── Jikan API ─────────────────────────────────────────────────────────────────
const JIKAN = "https://api.jikan.moe/v4";

async function fetchSchedule(day: string): Promise<{ mal_id: number; title: string; score: number; images: any }[]> {
  try {
    const res = await fetch(`${JIKAN}/schedules?filter=${day.toLowerCase()}&limit=10`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

const DAY_ES: Record<string, string> = {
  Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles",
  Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado", Sunday: "Domingo",
};
const DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TODAY_EN = DAY_EN[new Date().getDay()];

// ── Distinct genres & types ───────────────────────────────────────────────────
const ALL_GENRES = Array.from(new Set(CATALOG.flatMap((a) => a.genres))).sort();
const SCORE_OPTIONS = [{ label: "Cualquier score", min: 0 }, { label: "7+", min: 7 }, { label: "8+", min: 8 }, { label: "8.5+", min: 8.5 }, { label: "9+", min: 9 }];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  // Colors
  const surface = dark ? "#16191f" : "#ffffff";
  const border  = dark ? "#232730" : "#e5e7eb";
  const muted   = dark ? "#9ca3af" : "#6b7280";
  const textMain = dark ? "#f3f4f6" : "#111827";

  // Filters
  const [query, setQuery]             = useState("");
  const [genres, setGenres]           = useState<string[]>([]);
  const [statusFilter, setStatus]     = useState<"all" | "airing" | "finished" | "upcoming">("all");
  const [typeFilter, setType]         = useState<"all" | "TV" | "Movie" | "OVA">("all");
  const [minScore, setMinScore]       = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Local cover images mapped from catalog
  const [images] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const anime of CATALOG) {
      initial[anime.id] = anime.cover_image_url;
    }
    return initial;
  });
  const imgLoading = false;

  // Schedule
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [scheduleItems, setScheduleItems] = useState<{ mal_id: number; title: string }[]>([]);

  // Player
  const [selectedAnime, setSelectedAnime]     = useState<CatalogAnime | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [watchingTrailer, setWatchingTrailer] = useState(false);
  const [savedTime, setSavedTime]             = useState(0);
  const [lastSaved, setLastSaved]             = useState("En pausa");

  // ── Fetch today's schedule ──────────────────────────────────────────────────
  useEffect(() => {
    fetchSchedule(TODAY_EN).then((data) => {
      if (data.length > 0) setScheduleItems(data.map((d) => ({ mal_id: d.mal_id, title: d.title })));
    });
  }, []);

  // ── Filtered catalog ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return CATALOG.filter((a) => {
      if (q && !a.title.toLowerCase().includes(q) && !a.synopsis.toLowerCase().includes(q) && !a.genres.some((g) => g.toLowerCase().includes(q))) return false;
      if (genres.length > 0 && !genres.every((g) => a.genres.includes(g))) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (a.score < minScore) return false;
      return true;
    });
  }, [query, genres, statusFilter, typeFilter, minScore]);

  const toggleGenre = (g: string) =>
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const resetFilters = () => { setQuery(""); setGenres([]); setStatus("all"); setType("all"); setMinScore(0); };
  const activeFilters = genres.length + (statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0) + (minScore > 0 ? 1 : 0);

  const handleSelectAnime = (anime: CatalogAnime, ep: Episode, playTrailer = false) => {
    setSelectedAnime(anime);
    setSelectedEpisode(ep);
    setWatchingTrailer(playTrailer);
    setSavedTime(0);
    setLastSaved("En pausa");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTimeUpdate = (current: number) => {
    if (watchingTrailer) return;
    const r = Math.floor(current);
    if (r > 0 && r % 5 === 0 && r !== savedTime) {
      setSavedTime(r);
      setLastSaved(`Guardado: ${r}s`);
      fetch("http://localhost:4000/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "00000000-0000-0000-0000-000000000001", episodeId: selectedEpisode?.id, stoppedAtSec: r, completed: false }),
      }).catch(() => {});
    }
  };

  const asAnime = (a: CatalogAnime): Anime => ({
    id: a.id,
    title: a.title,
    synopsis: a.synopsis,
    genres: a.genres,
    release_year: a.release_year,
    cover_image_url: images[a.id] ?? a.cover_image_url,
    trailer_url: a.trailer_url,
    trailer_youtube_id: a.trailer_youtube_id,
    official_source: a.official_source,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYER VIEW
  if (selectedAnime && selectedEpisode) {
    const eps = EPISODES[selectedAnime.id] ?? [];
    const activeVideoUrl = watchingTrailer ? selectedAnime.trailer_url : selectedEpisode.video_url;
    const activeTitle = watchingTrailer
      ? `${selectedAnime.title} — Tráiler Oficial`
      : `${selectedAnime.title} — Ep. ${selectedEpisode.episode_number}: ${selectedEpisode.title}`;
    const activeSynopsis = watchingTrailer
      ? selectedAnime.synopsis
      : (selectedEpisode.synopsis || selectedAnime.synopsis);
    const activeYoutubeId = watchingTrailer
      ? selectedAnime.trailer_youtube_id
      : (selectedEpisode.youtube_preview_id || selectedAnime.trailer_youtube_id);
    const activeOfficialSource = watchingTrailer
      ? selectedAnime.official_source
      : (selectedEpisode.official_source || selectedAnime.official_source);

    return <>
      <Header dark={dark} muted={muted} border={border} surface={surface} textMain={textMain} onToggle={toggle} query={query} setQuery={setQuery} />
      <main style={{ padding: "24px 32px", maxWidth: 1240, margin: "0 auto" }}>
        <button onClick={() => { setSelectedAnime(null); setSelectedEpisode(null); setWatchingTrailer(false); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#e50914", cursor: "pointer", fontSize: 14, fontWeight: "bold", marginBottom: 20, padding: 0 }}>
          <ChevronLeft size={18} /> Volver al catálogo
        </button>

        {/* Title & Official Trailer Switcher */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 26, fontWeight: "bold", margin: 0 }}>{selectedAnime.title}</h1>
            {selectedAnime.title_jp && (
              <span style={{ fontSize: 13, color: muted, fontWeight: 500 }}>({selectedAnime.title_jp})</span>
            )}
            <StatusBadge status={selectedAnime.status} airing_day={selectedAnime.airing_day} airing_time={selectedAnime.airing_time_jst} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setWatchingTrailer(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: watchingTrailer ? "2px solid #f59e0b" : `1px solid ${border}`,
                backgroundColor: watchingTrailer ? "rgba(245, 158, 11, 0.18)" : surface,
                color: watchingTrailer ? "#f59e0b" : textMain,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              <Video size={15} /> Tráiler Oficial
            </button>
            <button
              onClick={() => setWatchingTrailer(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: !watchingTrailer ? "2px solid #e50914" : `1px solid ${border}`,
                backgroundColor: !watchingTrailer ? "rgba(229, 9, 20, 0.15)" : surface,
                color: !watchingTrailer ? "#e50914" : textMain,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: "bold",
              }}
            >
              <Play size={15} /> Avance Ep. {selectedEpisode.episode_number}
            </button>
          </div>
        </div>

        <p style={{ color: muted, marginBottom: 20, marginTop: 4, fontSize: 14, maxWidth: 850, lineHeight: 1.55 }}>
          {selectedAnime.synopsis}
        </p>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 660px" }}>
            <VideoPlayer
              src={activeVideoUrl}
              poster={images[selectedAnime.id] ?? selectedAnime.cover_image_url}
              title={activeTitle}
              synopsis={activeSynopsis}
              youtubeId={activeYoutubeId}
              officialSource={activeOfficialSource}
              isTrailer={watchingTrailer}
              introStartSec={selectedEpisode.intro_start_sec}
              introEndSec={selectedEpisode.intro_end_sec}
              onTimeUpdate={handleTimeUpdate}
            />

            {/* Active Video Metadata & Synopsis Box */}
            <div style={{ marginTop: 14, padding: "16px 20px", backgroundColor: surface, borderRadius: 8, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOpen size={16} color={watchingTrailer ? "#f59e0b" : "#e50914"} />
                  <span style={{ fontSize: 14, fontWeight: "bold", color: textMain }}>
                    {watchingTrailer
                      ? `Sinopsis General y Tráiler Oficial — ${selectedAnime.title}`
                      : `Avance y Sinopsis del Episodio ${selectedEpisode.episode_number}: "${selectedEpisode.title}"`}
                  </span>
                </div>
                <a
                  href={selectedAnime.official_channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#f59e0b", textDecoration: "none", fontWeight: 600 }}
                >
                  <ExternalLink size={12} /> Canal Oficial ({activeOfficialSource})
                </a>
              </div>

              <p style={{ margin: "0 0 12px", fontSize: 13.5, color: muted, lineHeight: 1.6 }}>
                {activeSynopsis}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: muted, borderTop: `1px solid ${border}`, paddingTop: 10 }}>
                <span>
                  {watchingTrailer
                    ? `Archivo local: ${selectedAnime.trailer_url}`
                    : `Archivo de avance local: ${selectedEpisode.video_url} · Intro IA: ${selectedEpisode.intro_start_sec}s – ${selectedEpisode.intro_end_sec}s`}
                </span>
                <span style={{ color: "#10b981", fontWeight: 600 }}>
                  {watchingTrailer ? "Tráiler HD Descargado" : lastSaved}
                </span>
              </div>
            </div>
          </div>

          {/* Sidebar: Trailer + Episodes with Video Preview & Synopsis */}
          <div style={{ flex: "0 0 360px", backgroundColor: surface, padding: 18, borderRadius: 10, border: `1px solid ${border}` }}>
            {/* Official Trailer Card */}
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "#f59e0b", margin: "0 0 10px", fontWeight: "bold", display: "flex", alignItems: "center", gap: 6 }}>
                <Video size={14} /> Tráiler Oficial del Anime
              </h3>
              <button
                onClick={() => setWatchingTrailer(true)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 8,
                  backgroundColor: watchingTrailer ? "rgba(245, 158, 11, 0.18)" : dark ? "#1f232c" : "#f9fafb",
                  border: watchingTrailer ? "2px solid #f59e0b" : `1px solid ${border}`,
                  color: textMain,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: "bold", color: watchingTrailer ? "#f59e0b" : textMain }}>
                    🎬 Ver Tráiler Oficial (PV)
                  </span>
                  <span style={{ fontSize: 10, backgroundColor: "#f59e0b", color: "#000", padding: "2px 6px", borderRadius: 4, fontWeight: "bold" }}>
                    OFICIAL
                  </span>
                </div>
                <div style={{ fontSize: 11, color: muted }}>
                  Fuente: {selectedAnime.official_source}
                </div>
              </button>
            </div>

            {/* Episodes List with Avance & Sinopsis */}
            <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: muted, margin: "0 0 12px", fontWeight: "bold" }}>
              Capítulos — Avance y Sinopsis (Videos)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {eps.map((ep) => {
                const isSelected = !watchingTrailer && selectedEpisode.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setSelectedEpisode(ep);
                      setWatchingTrailer(false);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 8,
                      backgroundColor: isSelected ? "rgba(229, 9, 20, 0.14)" : dark ? "#1f232c" : "#f3f4f6",
                      color: textMain,
                      border: isSelected ? "2px solid #e50914" : `1px solid ${border}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: "bold", color: isSelected ? "#e50914" : textMain }}>
                        Ep. {ep.episode_number} — {ep.title}
                      </span>
                      <span style={{ fontSize: 10, backgroundColor: isSelected ? "#e50914" : dark ? "#2d3340" : "#e5e7eb", color: isSelected ? "#fff" : muted, padding: "2px 6px", borderRadius: 4, fontWeight: "bold", flexShrink: 0 }}>
                        ▶ Avance
                      </span>
                    </div>
                    {ep.synopsis && (
                      <p style={{ margin: 0, fontSize: 11.5, color: muted, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {ep.synopsis}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 32 }}><CommentsSection episodeId={selectedEpisode.id} /></div>
      </main>
      <OtakuCopilotChat />
    </>;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CATALOG VIEW
  const airingAnimes = CATALOG.filter((a) => a.status === "airing");

  return <>
    <Header dark={dark} muted={muted} border={border} surface={surface} textMain={textMain} onToggle={toggle} query={query} setQuery={setQuery} />

    {/* Hero */}
    <div style={{ background: dark ? "linear-gradient(160deg,#0d0f12 0%,#1a0a0c 50%,#080d1a 100%)" : "linear-gradient(160deg,#fff5f5 0%,#fce4e6 50%,#f0f4ff 100%)", padding: "52px 32px 40px", textAlign: "center", borderBottom: `1px solid ${border}` }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Sparkles size={18} color="#e50914" />
        <span style={{ fontSize: 12, color: "#e50914", fontWeight: "bold", letterSpacing: 2 }}>PLATAFORMA STREAMING · TRÁILERS Y AVANCES OFICIALES</span>
        <Sparkles size={18} color="#e50914" />
      </div>
      <h1 style={{ fontSize: 40, fontWeight: 900, margin: "0 0 10px", letterSpacing: -1, color: textMain }}>
        Tu catálogo de <span style={{ color: "#e50914" }}>anime</span>
      </h1>
      <p style={{ color: muted, fontSize: 15, margin: "0 0 28px" }}>
        {CATALOG.length} series · Tráilers Oficiales · Avances y Sinopsis en Video por Capítulo · Moderación IA
      </p>
      <div style={{ maxWidth: 580, margin: "0 auto", position: "relative" }}>
        <Search size={17} color={muted} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input type="text" placeholder="Buscar por título, género o sinopsis..." value={query} onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", padding: "14px 44px 14px 48px", borderRadius: 10, border: `2px solid ${query ? "#e50914" : border}`, backgroundColor: surface, color: textMain, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: query ? "0 0 0 4px rgba(229,9,20,0.12)" : "none" }} />
        {query && <button onClick={() => setQuery("")} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 20, lineHeight: 1 }}>×</button>}
      </div>
    </div>

    {/* Airing Schedule Banner */}
    {airingAnimes.length > 0 && (
      <div style={{ backgroundColor: dark ? "#0e1118" : "#fffbeb", borderBottom: `1px solid ${border}` }}>
        <button onClick={() => setScheduleOpen((p) => !p)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 32px", background: "none", border: "none", cursor: "pointer", color: textMain, fontWeight: "bold", fontSize: 14 }}>
          <Radio size={16} color="#e50914" />
          <span style={{ color: "#e50914" }}>Horario de Emisión Semanal</span>
          <span style={{ marginLeft: "auto", color: muted }}>{scheduleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        </button>
        {scheduleOpen && (
          <div style={{ padding: "0 32px 20px", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: 12, minWidth: "max-content" }}>
              {(["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as AiringDay[]).map((day) => {
                const dayAnimes = airingAnimes.filter((a) => a.airing_day === day);
                const isToday = day === TODAY_EN;
                return (
                  <div key={day} style={{ minWidth: 160, backgroundColor: isToday ? (dark ? "#1a0a0c" : "#fff5f5") : surface, border: `1px solid ${isToday ? "#e50914" : border}`, borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Calendar size={12} color={isToday ? "#e50914" : muted} />
                      <span style={{ fontSize: 12, fontWeight: "bold", color: isToday ? "#e50914" : muted }}>
                        {DAY_ES[day]} {isToday && "·HOY"}
                      </span>
                    </div>
                    {dayAnimes.length === 0 ? (
                      <span style={{ fontSize: 11, color: muted }}>Sin emisiones</span>
                    ) : dayAnimes.map((a) => (
                      <div key={a.id} style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: "bold", color: textMain, lineHeight: 1.3 }}>{a.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Clock size={10} color="#e50914" />
                          <span style={{ fontSize: 11, color: "#e50914" }}>{a.airing_time_jst} JST</span>
                          {a.current_episode && <span style={{ fontSize: 10, color: muted }}>· Ep. {a.current_episode}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            {scheduleItems.length > 0 && (
              <p style={{ fontSize: 11, color: muted, marginTop: 10, marginBottom: 0 }}>
                📡 Jikan API — Otros animes que emiten hoy ({DAY_ES[TODAY_EN]}): {scheduleItems.slice(0, 5).map((s) => s.title).join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>
    )}

    {/* Filter Bar */}
    <div style={{ backgroundColor: surface, borderBottom: `1px solid ${border}`, position: "sticky", top: 57, zIndex: 40 }}>
      {/* Quick status + toggle */}
      <div style={{ padding: "10px 32px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {(["all","airing","finished","upcoming"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} style={{ padding: "5px 14px", borderRadius: 999, border: `1px solid ${statusFilter === s ? "#e50914" : border}`, backgroundColor: statusFilter === s ? "#e50914" : "transparent", color: statusFilter === s ? "#fff" : muted, cursor: "pointer", fontSize: 12, fontWeight: "bold", transition: "all 0.2s", whiteSpace: "nowrap" }}>
            {s === "all" ? "Todos" : s === "airing" ? "🔴 En emisión" : s === "finished" ? "Finalizados" : "Próximos"}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setShowFilters((p) => !p)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 8, border: `1px solid ${activeFilters > 0 ? "#e50914" : border}`, backgroundColor: activeFilters > 0 ? "rgba(229,9,20,0.1)" : "transparent", color: activeFilters > 0 ? "#e50914" : muted, cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>
            <Filter size={13} /> Filtros {activeFilters > 0 && `(${activeFilters})`} {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {activeFilters > 0 && <button onClick={resetFilters} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${border}`, backgroundColor: "transparent", color: muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><X size={12} /> Limpiar</button>}
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div style={{ padding: "12px 32px 16px", borderTop: `1px solid ${border}`, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Type */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: muted, fontWeight: "bold", minWidth: 60 }}>Tipo:</span>
            {(["all","TV","Movie","OVA"] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 6, border: `1px solid ${typeFilter === t ? "#6366f1" : border}`, backgroundColor: typeFilter === t ? "rgba(99,102,241,0.15)" : "transparent", color: typeFilter === t ? "#6366f1" : muted, cursor: "pointer", fontSize: 12 }}>
                {t === "TV" ? <Tv size={11} /> : t === "Movie" ? <Film size={11} /> : t === "OVA" ? <Disc size={11} /> : null} {t === "all" ? "Todos" : t}
              </button>
            ))}
          </div>
          {/* Score */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: muted, fontWeight: "bold", minWidth: 60 }}>Score:</span>
            {SCORE_OPTIONS.map((o) => (
              <button key={o.min} onClick={() => setMinScore(o.min)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 6, border: `1px solid ${minScore === o.min ? "#f59e0b" : border}`, backgroundColor: minScore === o.min ? "rgba(245,158,11,0.15)" : "transparent", color: minScore === o.min ? "#f59e0b" : muted, cursor: "pointer", fontSize: 12 }}>
                {o.min > 0 && <Star size={11} />} {o.label}
              </button>
            ))}
          </div>
          {/* Genres multi-select */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: muted, fontWeight: "bold", minWidth: 60, paddingTop: 4 }}>Géneros:</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ALL_GENRES.map((g) => (
                <button key={g} onClick={() => toggleGenre(g)} style={{ padding: "3px 12px", borderRadius: 999, border: `1px solid ${genres.includes(g) ? "#10b981" : border}`, backgroundColor: genres.includes(g) ? "rgba(16,185,129,0.15)" : "transparent", color: genres.includes(g) ? "#10b981" : muted, cursor: "pointer", fontSize: 11, transition: "all 0.15s" }}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Catalog */}
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ color: muted, fontSize: 13, margin: 0 }}>
          {filtered.length === CATALOG.length ? `${CATALOG.length} series con tráiler y avances` : `${filtered.length} de ${CATALOG.length} resultados`}
          {imgLoading && <span style={{ marginLeft: 8, color: "#6366f1" }}>· Cargando imágenes desde MAL…</span>}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: muted }}>
          <Search size={48} color={border} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 18, fontWeight: "bold", margin: "0 0 8px", color: textMain }}>Sin resultados</p>
          <p style={{ fontSize: 14, margin: "0 0 16px" }}>Prueba con otro título, género o ajusta los filtros.</p>
          <button onClick={resetFilters} style={{ padding: "8px 20px", borderRadius: 8, backgroundColor: "#e50914", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 22 }}>
          {filtered.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={asAnime(anime)}
              status={anime.status}
              score={anime.score}
              type={anime.type}
              airing_day={anime.airing_day}
              airing_time={anime.airing_time_jst}
              current_episode={anime.current_episode}
              imageUrl={images[anime.id] ?? anime.cover_image_url}
              imageLoading={false}
              episodes={EPISODES[anime.id] ?? []}
              onSelect={(_a, ep, playTrailer) => handleSelectAnime(anime, ep, playTrailer)}
            />
          ))}
        </div>
      )}
    </main>

    <OtakuCopilotChat />
  </>;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status, airing_day, airing_time }: { status: string; airing_day?: string; airing_time?: string }) {
  if (status === "airing") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: "rgba(229,9,20,0.15)", color: "#e50914", fontSize: 11, fontWeight: "bold", padding: "3px 10px", borderRadius: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#e50914", display: "inline-block", animation: "pulse 1.5s infinite" }} />
      EN EMISIÓN {airing_day && `· ${DAY_ES[airing_day]} ${airing_time ?? ""} JST`}
    </span>
  );
  if (status === "upcoming") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, backgroundColor: "rgba(99,102,241,0.15)", color: "#6366f1", fontSize: 11, fontWeight: "bold", padding: "3px 10px", borderRadius: 6 }}>
      <Clock size={11} /> PRÓXIMAMENTE
    </span>
  );
  return null;
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ dark, muted, border, surface, textMain, onToggle }: any) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 32px", backgroundColor: surface, borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: "#e50914", letterSpacing: 1 }}>PLATFORM-X</span>
        <span style={{ fontSize: 10, backgroundColor: dark ? "#272c38" : "#f3f4f6", color: muted, padding: "2px 8px", borderRadius: 4, fontWeight: "bold" }}>ANIME · IA</span>
      </div>
      <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onToggle} title={dark ? "Modo claro" : "Modo oscuro"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, border: `1px solid ${border}`, backgroundColor: dark ? "#232730" : "#f3f4f6", color: textMain, cursor: "pointer", transition: "all 0.2s" }}>
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </nav>
    </header>
  );
}
