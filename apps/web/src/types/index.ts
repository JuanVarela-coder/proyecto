export interface Anime {
  id: string;
  title: string;
  synopsis: string;
  genres: string[];
  release_year: number;
  cover_image_url: string;
  trailer_url?: string;
  trailer_youtube_id?: string;
  official_source?: string;
}

export interface Episode {
  id: string;
  anime_id: string;
  episode_number: number;
  title: string;
  synopsis?: string;
  video_url: string;
  preview_video_url?: string;
  youtube_preview_id?: string;
  official_source?: string;
  intro_start_sec?: number | null;
  intro_end_sec?: number | null;
  outro_start_sec?: number | null;
  outro_end_sec?: number | null;
  duration_sec?: number | null;
}

export interface WatchHistory {
  user_id: string;
  episode_id: string;
  stopped_at_sec: number;
  completed: boolean;
  updated_at: string;
}
