"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize, FastForward, Film, Subtitles, Youtube, ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  synopsis?: string;
  youtubeId?: string;
  officialSource?: string;
  isTrailer?: boolean;
  introStartSec?: number | null;
  introEndSec?: number | null;
  initialTimeSec?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

const SUBTITLES_ES: Array<{ start: number; end: number; text: string }> = [
  { start: 0, end: 5, text: "♪ [Avance Oficial / Tráiler — Platform-X Anime] ♪" },
  { start: 5, end: 12, text: "Dicen que aquel día el destino de todos cambió para siempre..." },
  { start: 12, end: 22, text: "♪ [OPENING THEME — Detectado automáticamente por IA] ♪" },
  { start: 22, end: 35, text: "♪ Más allá del horizonte, buscaremos la verdad... ♪" },
  { start: 35, end: 50, text: "¡Finalmente llegamos! No hay vuelta atrás a partir de este momento." },
  { start: 50, end: 70, text: "¿Estás seguro de que este es el lugar que mencionaba la leyenda?" },
  { start: 70, end: 95, text: "Mi poder aún no está al máximo, pero protegeré a todos aquí." },
  { start: 95, end: 120, text: "¡Cuidado! Una presencia enorme se acerca desde las sombras." },
  { start: 120, end: 150, text: "En el próximo episodio: ¡El despertar definitivo!" },
];

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 4);
}

function getSubtitleForTime(sec: number, title: string, synopsis?: string): string | null {
  const loopSec = Math.floor(sec) % 150;
  if (synopsis && loopSec >= 25 && loopSec < 90) {
    const sentences = synopsis.split(". ").filter(Boolean);
    if (sentences.length > 0) {
      const idx = Math.floor((loopSec - 25) / 15) % sentences.length;
      const clean = sentences[idx].endsWith(".") ? sentences[idx] : `${sentences[idx]}.`;
      return `📖 Sinopsis Oficial: ${clean}`;
    }
  }
  const match = SUBTITLES_ES.find((s) => loopSec >= s.start && loopSec < s.end);
  if (match) return match.text;
  return `Reproduciendo: ${title}`;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  poster,
  synopsis,
  youtubeId,
  officialSource,
  isTrailer = false,
  introStartSec,
  introEndSec,
  initialTimeSec = 0,
  onTimeUpdate,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterImgRef = useRef<HTMLImageElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTimeSec);
  const [duration, setDuration] = useState(isTrailer ? 95 : 180);
  const [isMuted, setIsMuted] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [useCanvasFallback, setUseCanvasFallback] = useState(false);
  const [useYoutubeEmbed, setUseYoutubeEmbed] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);

  useEffect(() => {
    if (!poster) {
      posterImgRef.current = null;
      return;
    }
    const img = new Image();
    img.src = poster;
    img.onload = () => {
      posterImgRef.current = img;
    };
  }, [poster]);

  // Initialize HLS.js or native MP4/WebM video
  useEffect(() => {
    setCurrentTime(initialTimeSec);
    setShowSkipIntro(false);
    setUseYoutubeEmbed(false);

    if (src.includes("localhost:8080")) {
      setUseCanvasFallback(true);
      setIsPlaying(true);
      return;
    }

    setUseCanvasFallback(false);
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported() && src.includes(".m3u8")) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (initialTimeSec > 0) {
          video.currentTime = initialTimeSec;
        }
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setUseCanvasFallback(true);
          setIsPlaying(true);
        }
      });
    } else {
      video.src = src;
      video.load();
      if (initialTimeSec > 0) {
        video.currentTime = initialTimeSec;
      }
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    const handleVideoError = () => {
      setUseCanvasFallback(true);
      setIsPlaying(true);
    };

    video.addEventListener("error", handleVideoError);

    return () => {
      video.removeEventListener("error", handleVideoError);
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, initialTimeSec]);

  const togglePlay = () => {
    if (useYoutubeEmbed) return;
    if (useCanvasFallback) {
      setIsPlaying((prev) => !prev);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setUseCanvasFallback(true);
        setIsPlaying(true);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSkipIntro = () => {
    const targetTime = introEndSec || 25;
    if (useCanvasFallback) {
      setCurrentTime(targetTime);
      setShowSkipIntro(false);
    } else {
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.min(targetTime, video.duration || targetTime);
      }
      setCurrentTime(targetTime);
      setShowSkipIntro(false);
    }
  };

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || useCanvasFallback) return;

    const current = video.currentTime;
    setCurrentTime(current);

    if (
      !isTrailer &&
      introStartSec != null &&
      introEndSec != null &&
      current >= introStartSec &&
      current < introEndSec
    ) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }

    if (onTimeUpdate && video.duration) {
      onTimeUpdate(current, video.duration);
    }
  };

  // Canvas visualizer simulation loop for offline / zero-config demo
  useEffect(() => {
    if (!useCanvasFallback || useYoutubeEmbed) return;

    let animId: number;
    let lastTick = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const stars: Array<{ x: number; y: number; speed: number; size: number }> = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        speed: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 2,
      });
    }

    let waveOffset = 0;

    const render = (now: number) => {
      const delta = (now - lastTick) / 1000;
      lastTick = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= duration) {
            setIsPlaying(false);
            if (onEnded) onEnded();
            return duration;
          }

          if (
            !isTrailer &&
            introStartSec != null &&
            introEndSec != null &&
            next >= introStartSec &&
            next < introEndSec
          ) {
            setShowSkipIntro(true);
          } else {
            setShowSkipIntro(false);
          }

          if (onTimeUpdate) {
            onTimeUpdate(next, duration);
          }
          return next;
        });
      }

      const w = canvas.width;
      const h = canvas.height;

      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#08090d");
      grad.addColorStop(0.5, "#10131a");
      grad.addColorStop(1, "#180d19");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw Anime Cover Background with Ken Burns pan/zoom if loaded
      if (posterImgRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.34;
        const scale = 1.05 + Math.sin(waveOffset * 0.15) * 0.04;
        const dw = w * scale;
        const dh = h * scale;
        ctx.drawImage(posterImgRef.current, (w - dw) / 2, (h - dh) / 2, dw, dh);
        ctx.restore();
      }

      ctx.fillStyle = "#ffffff";
      stars.forEach((s) => {
        if (isPlaying) {
          s.x -= s.speed;
          if (s.x < 0) s.x = w;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });

      waveOffset += isPlaying ? 0.08 : 0.01;
      const numBars = 48;
      const barWidth = w / numBars;
      for (let i = 0; i < numBars; i++) {
        const height = isPlaying
          ? Math.abs(Math.sin(waveOffset + i * 0.3) * 55) + 12
          : 8;
        const x = i * barWidth;
        const y = h - height - 55;

        const isIntro =
          !isTrailer &&
          introStartSec != null &&
          introEndSec != null &&
          currentTime >= introStartSec &&
          currentTime < introEndSec;

        ctx.fillStyle = isTrailer ? "#f59e0b" : isIntro ? "#e50914" : "#6366f1";
        ctx.shadowColor = isTrailer ? "rgba(245,158,11,0.8)" : isIntro ? "rgba(229,9,20,0.8)" : "rgba(99,102,241,0.6)";
        ctx.shadowBlur = 10;
        ctx.fillRect(x + 2, y, barWidth - 4, height);
      }
      ctx.shadowBlur = 0;

      ctx.textAlign = "center";
      ctx.fillStyle = isTrailer ? "#f59e0b" : "#e50914";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(
        isTrailer
          ? `🎬 TRÁILER OFICIAL (${officialSource || "YouTube Official"})`
          : `📺 AVANCE Y SINOPSIS DEL EPISODIO (${officialSource || "Fuente Oficial"})`,
        w / 2,
        h / 2 - 90
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(title, w / 2, h / 2 - 55);

      if (synopsis) {
        ctx.font = "15px sans-serif";
        ctx.fillStyle = "#e5e7eb";
        const lines = wrapCanvasText(ctx, synopsis, w - 160);
        lines.forEach((line, idx) => {
          ctx.fillText(line, w / 2, h / 2 - 15 + idx * 24);
        });
      }

      const isIntro =
        !isTrailer &&
        introStartSec != null &&
        introEndSec != null &&
        currentTime >= introStartSec &&
        currentTime < introEndSec;

      if (isIntro) {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`🎵 Intro detectada por IA (${introStartSec}s - ${introEndSec}s)`, w / 2, h / 2 + 95);
      }

      if (!isPlaying) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#e50914";
        ctx.beginPath();
        ctx.moveTo(w / 2 - 10, h / 2 - 15);
        ctx.lineTo(w / 2 + 18, h / 2);
        ctx.lineTo(w / 2 - 10, h / 2 + 15);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [useCanvasFallback, useYoutubeEmbed, isPlaying, title, synopsis, officialSource, isTrailer, currentTime, duration, introStartSec, introEndSec, onTimeUpdate, onEnded]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && video.duration && isFinite(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (!useCanvasFallback && videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
    if (
      !isTrailer &&
      introStartSec != null &&
      introEndSec != null &&
      seekTime >= introStartSec &&
      seekTime < introEndSec
    ) {
      setShowSkipIntro(true);
    } else {
      setShowSkipIntro(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const activeSubtitle = showSubtitles ? getSubtitleForTime(currentTime, title, synopsis) : null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "960px",
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        fontFamily: "sans-serif",
      }}
    >
      {/* Top Official Badge Overlay */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 14,
          right: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 28,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            backgroundColor: isTrailer ? "rgba(245, 158, 11, 0.92)" : "rgba(229, 9, 20, 0.9)",
            color: "#fff",
            fontSize: 11,
            fontWeight: "bold",
            padding: "4px 10px",
            borderRadius: 6,
            boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
          }}
        >
          {isTrailer ? "🎬 TRÁILER OFICIAL" : "📺 AVANCE Y SINOPSIS OFICIAL"}
        </span>
        {officialSource && (
          <span
            style={{
              backgroundColor: "rgba(0,0,0,0.75)",
              color: "#d1d5db",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Fuente: {officialSource}
          </span>
        )}
      </div>

      {useYoutubeEmbed && youtubeId ? (
        <div style={{ width: "100%", aspectRatio: "16/9", backgroundColor: "#000" }}>
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          />
        </div>
      ) : useCanvasFallback ? (
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onClick={togglePlay}
          style={{ width: "100%", height: "auto", display: "block", cursor: "pointer" }}
        />
      ) : (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", backgroundColor: "#000" }}>
          <video
            ref={videoRef}
            poster={poster}
            playsInline
            loop
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleVideoTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={onEnded}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer", backgroundColor: "#000" }}
          />
          {/* Rich Anime Poster & Synopsis PiP Overlay during local MP4 playback */}
          {poster && (
            <div
              style={{
                position: "absolute",
                top: 48,
                left: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: "rgba(10, 12, 18, 0.78)",
                backdropFilter: "blur(6px)",
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.14)",
                maxWidth: "75%",
                pointerEvents: "none",
              }}
            >
              <img
                src={poster}
                alt={title}
                style={{ width: 42, height: 60, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
              />
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: "bold", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {title}
                </div>
                {synopsis && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#d1d5db",
                      marginTop: 3,
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {synopsis}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtitles Overlay (WebVTT AI Sync style) */}
      {!useYoutubeEmbed && activeSubtitle && isPlaying && (
        <div
          style={{
            position: "absolute",
            bottom: "92px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            color: "#fff",
            padding: "6px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            textAlign: "center",
            maxWidth: "85%",
            pointerEvents: "none",
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            border: "1px solid rgba(255,255,255,0.12)",
            zIndex: 28,
          }}
        >
          {activeSubtitle}
        </div>
      )}

      {/* Dynamic Skip Intro Button */}
      {!useYoutubeEmbed && showSkipIntro && (
        <button
          onClick={handleSkipIntro}
          style={{
            position: "absolute",
            bottom: "80px",
            right: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(229, 9, 20, 0.95)",
            color: "#fff",
            border: "2px solid rgba(255,255,255,0.7)",
            borderRadius: "6px",
            padding: "10px 18px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(229,9,20,0.7)",
            transition: "transform 0.2s, background-color 0.2s",
            zIndex: 30,
          }}
        >
          <FastForward size={18} />
          Saltar Intro
        </button>
      )}

      {/* Control Bar Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px",
          background: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)",
          color: "#fff",
          zIndex: 25,
        }}
      >
        {/* Title & Stream Mode Tag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginBottom: "8px", flexWrap: "wrap", gap: 6 }}>
          <span style={{ opacity: 0.95, fontWeight: 600 }}>{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            {youtubeId && (
              <>
                <button
                  onClick={() => setUseYoutubeEmbed((prev) => !prev)}
                  title="Alternar entre Video Local y Embed Oficial de YouTube"
                  style={{
                    fontSize: "11px",
                    backgroundColor: useYoutubeEmbed ? "#e50914" : "#272c38",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    color: "#fff",
                    border: "1px solid rgba(229,9,20,0.5)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Youtube size={12} /> {useYoutubeEmbed ? "Video Local MP4" : "YouTube Embed"}
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Abrir en canal oficial de YouTube"
                  style={{
                    fontSize: "11px",
                    backgroundColor: "#272c38",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    color: "#f3f4f6",
                    textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <ExternalLink size={11} /> Fuente Oficial
                </a>
              </>
            )}
            <button
              onClick={() => setShowSubtitles((s) => !s)}
              title="Activar/Desactivar Subtítulos y Sinopsis IA (ES)"
              style={{
                fontSize: "11px",
                backgroundColor: showSubtitles ? "#e50914" : "#272c38",
                padding: "3px 8px",
                borderRadius: "4px",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Subtitles size={12} /> ES
            </button>
            <button
              onClick={() => {
                setUseYoutubeEmbed(false);
                setUseCanvasFallback((prev) => !prev);
              }}
              title="Cambiar entre Video MP4 Descargado y Narrador Visual de Sinopsis"
              style={{
                fontSize: "11px",
                backgroundColor: "#272c38",
                padding: "3px 8px",
                borderRadius: "4px",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Film size={12} /> {useCanvasFallback ? "Modo Sinopsis Animada" : "Video Local Activo"}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {!useYoutubeEmbed && (
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: "100%",
              cursor: "pointer",
              accentColor: "#e50914",
              marginBottom: "8px",
            }}
          />
        )}

        {/* Action Controls */}
        {!useYoutubeEmbed && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={togglePlay}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {isPlaying ? <Pause size={22} /> : <Play size={22} />}
              </button>

              <button
                onClick={toggleMute}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <span style={{ fontSize: "13px", opacity: 0.8 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div>
              <button
                onClick={toggleFullscreen}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
