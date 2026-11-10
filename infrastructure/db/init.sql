-- ============================================================================
-- PLATFORM-X ANIME - POSTGRESQL INITIAL DATABASE SCHEMA
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Table: animes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS animes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    synopsis TEXT,
    genres TEXT[] DEFAULT '{}'::TEXT[],
    release_year INTEGER,
    cover_image_url TEXT,
    trailer_url TEXT,
    trailer_youtube_id VARCHAR(32),
    official_source VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Table: episodes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anime_id UUID NOT NULL REFERENCES animes(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT,
    video_url TEXT NOT NULL,
    preview_video_url TEXT,
    youtube_preview_id VARCHAR(32),
    intro_start_sec NUMERIC(8, 2),
    intro_end_sec NUMERIC(8, 2),
    outro_start_sec NUMERIC(8, 2),
    outro_end_sec NUMERIC(8, 2),
    duration_sec NUMERIC(8, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_anime_episode UNIQUE (anime_id, episode_number)
);

-- ----------------------------------------------------------------------------
-- 3. Table: watch_history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watch_history (
    user_id UUID NOT NULL,
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    stopped_at_sec NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, episode_id)
);

-- ----------------------------------------------------------------------------
-- 4. Performance Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_animes_release_year ON animes(release_year);
CREATE INDEX IF NOT EXISTS idx_animes_genres ON animes USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON episodes(anime_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_updated ON watch_history(updated_at DESC);

-- ----------------------------------------------------------------------------
-- 5. Seed Data for Testing & Validation
-- ----------------------------------------------------------------------------
INSERT INTO animes (id, title, synopsis, genres, release_year, cover_image_url)
VALUES 
    (
        'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        'Steins;Gate',
        'Un grupo de amigos en Akihabara descubre cómo enviar mensajes de texto al pasado usando un microondas modificado.',
        ARRAY['Ciencia Ficción', 'Suspenso', 'Psicológico', 'Viajes en el tiempo'],
        2011,
        '/covers/steins-gate.svg'
    ),
    (
        'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        'Frieren: Beyond Journey''s End',
        'La elfa maga Frieren emprende un viaje para comprender a la humanidad tras la muerte del héroe Himmel.',
        ARRAY['Fantasía', 'Aventura', 'Drama', 'Recuentos de la vida'],
        2023,
        '/covers/frieren.jpg'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO episodes (id, anime_id, episode_number, title, video_url, intro_start_sec, intro_end_sec, duration_sec)
VALUES
    (
        'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        1,
        'Prólogo del Principio y el Fin',
        'http://localhost:8080/hls/sample/master.m3u8',
        90.00,
        180.00,
        1440.00
    ),
    (
        'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f90',
        'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        1,
        'El Fin del Viaje',
        'http://localhost:8080/hls/sample/master.m3u8',
        120.00,
        210.00,
        1500.00
    )
ON CONFLICT (id) DO NOTHING;
