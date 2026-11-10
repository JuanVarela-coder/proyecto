import { Router, Request, Response } from "express";
import http from "http";

const router = Router();

// In-memory comments store for real-time demo
interface Comment {
  id: string;
  episodeId: string;
  userId: string;
  userName: string;
  originalText: string;
  processedText: string;
  status: "approved" | "blocked" | "tagged_spoiler";
  badge: string;
  createdAt: string;
}

let commentsStore: Comment[] = [
  {
    id: "c1",
    episodeId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    userId: "u1",
    userName: "OkabeRintaro",
    originalText: "¡El Psy Kongroo! La trama es simplemente brillante.",
    processedText: "¡El Psy Kongroo! La trama es simplemente brillante.",
    status: "approved",
    badge: "Limpio",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "c2",
    episodeId: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
    userId: "u2",
    userName: "AnimeFan99",
    originalText: "Increíble cómo muere el personaje en la azotea al final.",
    processedText: "<spoiler>Increíble cómo muere el personaje en la azotea al final.</spoiler>",
    status: "tagged_spoiler",
    badge: "Spoiler Oculto ⚠️",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

// GET /api/comments/:episodeId - Retrieve comments for an episode
router.get("/comments/:episodeId", (req: Request, res: Response) => {
  const { episodeId } = req.params;
  const list = commentsStore.filter((c) => c.episodeId === episodeId && c.status !== "blocked");
  return res.json({ count: list.length, data: list });
});

// POST /api/comments - Submit a new comment and moderate via Community Governance Agent
router.post("/comments", async (req: Request, res: Response) => {
  const { episodeId, userId = "user_anon", userName = "OtakuUser", commentText } = req.body;

  if (!episodeId || !commentText) {
    return res.status(400).json({ error: "Missing required fields: episodeId, commentText" });
  }

  try {
    const aiUrl = process.env.AI_ORCHESTRATOR_URL || "http://localhost:8000";
    
    // Call Community Governance Agent in AI Orchestrator
    const response = await fetch(`${aiUrl}/agents/moderate-comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_text: commentText, user_id: userId }),
    });

    const modResult: any = await response.json();
    const agentData = modResult.data || {};

    if (agentData.status === "blocked") {
      return res.status(403).json({
        error: "Comentario bloqueado por incumplimiento de normas comunitarias",
        reason: agentData.reason,
      });
    }

    const newComment: Comment = {
      id: `c_${Date.now()}`,
      episodeId,
      userId,
      userName,
      originalText: commentText,
      processedText: agentData.processed_text || commentText,
      status: agentData.status || "approved",
      badge: agentData.badge || "Limpio",
      createdAt: new Date().toISOString(),
    };

    commentsStore.unshift(newComment);

    return res.status(201).json({
      success: true,
      comment: newComment,
    });
  } catch (error: any) {
    console.error("[Comment Routes] AI Moderation error:", error.message);
    
    // Graceful fallback if AI orchestrator is unreachable
    const fallbackComment: Comment = {
      id: `c_${Date.now()}`,
      episodeId,
      userId,
      userName,
      originalText: commentText,
      processedText: commentText,
      status: "approved",
      badge: "Limpio (Sin Moderar)",
      createdAt: new Date().toISOString(),
    };
    commentsStore.unshift(fallbackComment);

    return res.status(201).json({ success: true, comment: fallbackComment });
  }
});

export default router;
