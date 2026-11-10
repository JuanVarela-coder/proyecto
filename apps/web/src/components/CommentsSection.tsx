"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, Send, User } from "lucide-react";

interface CommentItem {
  id: string;
  userName: string;
  processedText: string;
  status: "approved" | "blocked" | "tagged_spoiler";
  badge: string;
  createdAt: string;
}

interface CommentsSectionProps {
  episodeId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ episodeId }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  const [statusMsg, setStatusMsg] = useState("");

  // Fetch comments
  useEffect(() => {
    fetch(`http://localhost:4000/api/comments/${episodeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) setComments(data.data);
      })
      .catch(() => {
        // Fallback default comments if API is offline
        setComments([
          {
            id: "1",
            userName: "OkabeRintaro",
            processedText: "¡El Psy Kongroo! La trama es simplemente brillante.",
            status: "approved",
            badge: "Limpio",
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            userName: "AnimeFan99",
            processedText: "<spoiler>Increíble cómo muere el personaje en la azotea al final.</spoiler>",
            status: "tagged_spoiler",
            badge: "Spoiler Oculto ⚠️",
            createdAt: new Date().toISOString(),
          },
        ]);
      });
  }, [episodeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setStatusMsg("Moderando con Community Governance Agent...");

    try {
      const res = await fetch("http://localhost:4000/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId,
          commentText: text.trim(),
          userName: "UsuarioActual",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg(json.error || "Comentario rechazado");
        return;
      }

      setComments((prev) => [json.comment, ...prev]);
      setText("");
      setStatusMsg(`Comentario publicado (${json.comment.badge})`);
    } catch {
      setStatusMsg("Error de conexión al enviar comentario");
    }
  };

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderCommentContent = (id: string, text: string) => {
    if (text.includes("<spoiler>")) {
      const clean = text.replace("<spoiler>", "").replace("</spoiler>", "");
      const isRevealed = revealedSpoilers[id];

      return (
        <span
          onClick={() => toggleSpoiler(id)}
          style={{
            backgroundColor: isRevealed ? "rgba(229,9,20,0.15)" : "#374151",
            color: isRevealed ? "#f3f4f6" : "transparent",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: "4px",
            userSelect: isRevealed ? "auto" : "none",
            filter: isRevealed ? "none" : "blur(4px)",
            transition: "filter 0.2s, color 0.2s",
            display: "inline-block",
          }}
          title={isRevealed ? "Click para ocultar" : "Click para ver spoiler"}
        >
          {clean}
        </span>
      );
    }
    return <span>{text}</span>;
  };

  return (
    <div
      style={{
        marginTop: "32px",
        backgroundColor: "#16191f",
        padding: "24px",
        borderRadius: "8px",
        border: "1px solid #232730",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "18px" }}>
          Comentarios de la Comunidad ({comments.length})
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981" }}>
          <ShieldCheck size={16} /> Moderación IA en Tiempo Real
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Escribe tu comentario (spoilers y toxicidad serán filtrados automáticamente)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "6px",
              backgroundColor: "#11141a",
              border: "1px solid #282f3d",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: "#e50914",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 20px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Send size={16} /> Enviar
          </button>
        </div>
        {statusMsg && (
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#9ca3af" }}>
            {statusMsg}
          </div>
        )}
      </form>

      {/* Comments List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              backgroundColor: "#1c212b",
              padding: "12px 16px",
              borderRadius: "6px",
              border: "1px solid #232730",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold", fontSize: "13px" }}>
                <User size={14} color="#9ca3af" /> {c.userName}
              </div>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  backgroundColor:
                    c.status === "tagged_spoiler"
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(16, 185, 129, 0.2)",
                  color: c.status === "tagged_spoiler" ? "#f59e0b" : "#10b981",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {c.status === "tagged_spoiler" && <AlertTriangle size={12} />}
                {c.badge}
              </span>
            </div>
            <div style={{ fontSize: "14px", color: "#e5e7eb", lineHeight: "1.5" }}>
              {renderCommentContent(c.id, c.processedText)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
