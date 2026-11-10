"use client";

import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Clock, Play, Star, Tv, Film, Disc, Video } from "lucide-react";
import { Anime, Episode } from "../types";

interface AnimeCardProps {
  anime: Anime;
  episodes: Episode[];
  onSelect: (anime: Anime, episode: Episode, playTrailer?: boolean) => void;
  imageUrl?: string;
  imageLoading?: boolean;
  status?: "airing" | "finished" | "upcoming";
  score?: number;
  type?: "TV" | "Movie" | "OVA" | "Special";
  airing_day?: string;
  airing_time?: string;
  current_episode?: number;
}

const DAY_ES: Record<string, string> = {
  Monday: "Lun", Tuesday: "Mar", Wednesday: "Mié",
  Thursday: "Jue", Friday: "Vie", Saturday: "Sáb", Sunday: "Dom",
};

const TypeIcon = ({ type }: { type?: string }) => {
  if (type === "Movie") return <Film size={10} />;
  if (type === "OVA") return <Disc size={10} />;
  return <Tv size={10} />;
};

export function AnimeCard({
  anime, episodes, onSelect,
  imageUrl, imageLoading,
  status = "finished", score, type,
  airing_day, airing_time, current_episode,
}: AnimeCardProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [hovered, setHovered] = React.useState(false);
  const firstEp = episodes[0];

  const surface = dark ? "#16191f" : "#ffffff";
  const border = dark ? "#232730" : "#e5e7eb";
  const muted = dark ? "#9ca3af" : "#6b7280";
  const textMain = dark ? "#f3f4f6" : "#111827";

  // Skeleton shimmer color
  const shimmer = dark ? "#1c212b" : "#f3f4f6";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => firstEp && onSelect(anime, firstEp, false)}
      style={{
        borderRadius: 10,
        overflow: "hidden",
        cursor: firstEp ? "pointer" : "default",
        backgroundColor: surface,
        border: `1px solid ${hovered ? (status === "airing" ? "#e50914" : border) : border}`,
        boxShadow: hovered
          ? `0 12px 32px ${status === "airing" ? "rgba(229,9,20,0.2)" : "rgba(0,0,0,0.15)"}`
          : dark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
        transform: hovered ? "translateY(-4px) scale(1.02)" : "none",
        transition: "all 0.22s ease",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Cover image area */}
      <div style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden", backgroundColor: shimmer }}>
        {imageLoading ? (
          /* Skeleton */
          <div style={{ width: "100%", height: "100%", backgroundColor: shimmer, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${dark ? "#232730" : "#e5e7eb"}`, borderTopColor: "#e50914", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 10, color: muted }}>Cargando imagen…</span>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={anime.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
            onError={(e) => { (e.target as HTMLImageElement).src = anime.cover_image_url || `/covers/steins-gate.svg`; }}
          />
        ) : (
          /* No image fallback — gradient placeholder */
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${dark ? "#1a1030" : "#ede9fe"}, ${dark ? "#0d1a20" : "#e0f2fe"})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            🎌
          </div>
        )}

        {/* Play overlay */}
        {hovered && firstEp && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 12 }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", backgroundColor: "#e50914", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(229,9,20,0.8)" }}>
              <Play size={22} color="#fff" fill="#fff" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(anime, firstEp, true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(245, 158, 11, 0.95)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              <Video size={13} /> Ver Tráiler Oficial
            </button>
          </div>
        )}

        {/* Top-left: Airing badge OR year */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          {status === "airing" ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, backgroundColor: "rgba(229,9,20,0.92)", color: "#fff", fontSize: 10, fontWeight: "bold", padding: "3px 8px", borderRadius: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#fff", display: "inline-block" }} />
              EN VIVO
            </span>
          ) : status === "upcoming" ? (
            <span style={{ backgroundColor: "rgba(99,102,241,0.9)", color: "#fff", fontSize: 10, fontWeight: "bold", padding: "3px 8px", borderRadius: 5 }}>PRÓXIMO</span>
          ) : (
            <span style={{ backgroundColor: "rgba(0,0,0,0.72)", color: "#fff", fontSize: 10, fontWeight: "bold", padding: "3px 8px", borderRadius: 5 }}>{anime.release_year}</span>
          )}
        </div>

        {/* Top-right: score */}
        {score != null && (
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.75)", color: "#f59e0b", fontSize: 11, fontWeight: "bold", padding: "3px 8px", borderRadius: 5 }}>
            <Star size={10} fill="#f59e0b" /> {score.toFixed(2)}
          </div>
        )}

        {/* Bottom overlay: airing schedule */}
        {status === "airing" && airing_day && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(229,9,20,0.88)", padding: "5px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#fff", fontWeight: "bold" }}>
              <Clock size={9} style={{ marginRight: 3 }} />{DAY_ES[airing_day]} {airing_time} JST
            </span>
            {current_episode != null && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)" }}>Ep. {current_episode}</span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Type pill + Trailer tag */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 5 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: muted, fontWeight: "bold" }}>
            <TypeIcon type={type} /> {type ?? "TV"}
          </span>
          <span style={{ fontSize: 10, color: "#f59e0b", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: 3 }}>
            🎬 Tráiler + Avances
          </span>
        </div>

        <h3 style={{ margin: "0 0 5px", fontSize: 14, fontWeight: "bold", color: textMain, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {anime.title}
        </h3>
        <p style={{ margin: "0 0 9px", fontSize: 11, color: muted, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {anime.synopsis}
        </p>

        {/* Genres */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: "auto" }}>
          {anime.genres.slice(0, 3).map((g) => (
            <span key={g} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, backgroundColor: dark ? "#232730" : "#f3f4f6", color: muted }}>
              {g}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
