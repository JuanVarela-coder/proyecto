import { Router, Request, Response } from "express";
import { pool } from "../config/db";

const router = Router();

// POST /api/history - Upsert watch progress
router.post("/history", async (req: Request, res: Response) => {
  const { userId, episodeId, stoppedAtSec, completed = false } = req.body;

  if (!userId || !episodeId || stoppedAtSec === undefined) {
    return res.status(400).json({
      error: "Missing required fields: userId, episodeId, stoppedAtSec",
    });
  }

  try {
    const query = `
      INSERT INTO watch_history (user_id, episode_id, stopped_at_sec, completed, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, episode_id) 
      DO UPDATE SET
        stopped_at_sec = EXCLUDED.stopped_at_sec,
        completed = EXCLUDED.completed,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await pool.query(query, [
      userId,
      episodeId,
      stoppedAtSec,
      completed,
    ]);

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error("[History Routes] Error updating watch history:", error);
    return res.status(500).json({ error: "Failed to save playback progress" });
  }
});

// GET /api/history/:userId - Get watch history for user
router.get("/history/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const query = `
      SELECT 
        wh.user_id,
        wh.episode_id,
        wh.stopped_at_sec,
        wh.completed,
        wh.updated_at,
        e.episode_number,
        e.title AS episode_title,
        e.duration_sec,
        a.id AS anime_id,
        a.title AS anime_title,
        a.cover_image_url
      FROM watch_history wh
      JOIN episodes e ON wh.episode_id = e.id
      JOIN animes a ON e.anime_id = a.id
      WHERE wh.user_id = $1
      ORDER BY wh.updated_at DESC
      LIMIT 50;
    `;

    const result = await pool.query(query, [userId]);
    return res.json({ count: result.rows.length, data: result.rows });
  } catch (error: any) {
    console.error(`[History Routes] Error retrieving history for ${userId}:`, error);
    return res.status(500).json({ error: "Failed to retrieve history" });
  }
});

export default router;
