import { Router, Request, Response } from "express";
import { pool } from "../config/db";
import { redisClient } from "../config/redis";

const router = Router();

// GET /api/animes - List all animes with Redis caching
router.get("/animes", async (_req: Request, res: Response) => {
  const cacheKey = "animes:all";

  try {
    // 1. Check Redis Cache
    if (redisClient.isOpen) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({ source: "cache", data: JSON.parse(cached) });
      }
    }

    // 2. Query Database
    const result = await pool.query(`
      SELECT id, title, synopsis, genres, release_year, cover_image_url, trailer_url, trailer_youtube_id, official_source, created_at
      FROM animes
      ORDER BY release_year DESC, title ASC
    `);

    // 3. Set Cache with 5 minute TTL
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result.rows));
    }

    return res.json({ source: "database", data: result.rows });
  } catch (error: any) {
    console.error("[Anime Routes] Error fetching animes:", error);
    return res.status(500).json({ error: "Failed to retrieve animes" });
  }
});

// GET /api/animes/:id - Get single anime with its episodes
router.get("/animes/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const animeResult = await pool.query(
      `SELECT * FROM animes WHERE id = $1`,
      [id]
    );

    if (animeResult.rows.length === 0) {
      return res.status(404).json({ error: "Anime not found" });
    }

    const episodesResult = await pool.query(
      `SELECT id, episode_number, title, synopsis, video_url, preview_video_url, youtube_preview_id, intro_start_sec, intro_end_sec, duration_sec
       FROM episodes
       WHERE anime_id = $1
       ORDER BY episode_number ASC`,
      [id]
    );

    return res.json({
      ...animeResult.rows[0],
      episodes: episodesResult.rows,
    });
  } catch (error: any) {
    console.error(`[Anime Routes] Error fetching anime ${id}:`, error);
    return res.status(500).json({ error: "Failed to retrieve anime details" });
  }
});

// GET /api/episodes/:id - Get episode details and intro timestamps
router.get("/episodes/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT e.*, a.title as anime_title
       FROM episodes e
       JOIN animes a ON e.anime_id = a.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Episode not found" });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    console.error(`[Anime Routes] Error fetching episode ${id}:`, error);
    return res.status(500).json({ error: "Failed to retrieve episode details" });
  }
});

export default router;
