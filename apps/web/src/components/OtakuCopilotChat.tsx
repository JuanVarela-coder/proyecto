"use client";

import React, { useState } from "react";
import { MessageSquare, Sparkles, Send, X, Bot } from "lucide-react";

interface Message {
  role: "user" | "copilot";
  text: string;
  recommendations?: Array<{
    anime_id: string;
    title: string;
    match_score: number;
    reason: string;
  }>;
}

export const OtakuCopilotChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "copilot",
      text: "¡Konnichiwa! Soy Otaku Copilot 🤖✨. Cuéntame qué emoción buscas o qué temática te apetece y usaré búsqueda semántica para recomendarte el mejor anime.",
    },
  ]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/agents/otaku-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      const json = await res.json();
      const copilotData = json.data;

      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: copilotData.reply,
          recommendations: copilotData.recommendations,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: "No pude conectar con el orquestador de IA. Asegúrate de tener corriendo uvicorn en el puerto 8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#e50914",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 20px rgba(229,9,20,0.5)",
          cursor: "pointer",
          zIndex: 100,
        }}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "24px",
            width: "380px",
            height: "520px",
            backgroundColor: "#16191f",
            borderRadius: "12px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
            border: "1px solid #232730",
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
            overflow: "hidden",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              backgroundColor: "#1c212b",
              borderBottom: "1px solid #282f3d",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Bot size={20} color="#e50914" />
            <div>
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>Otaku Copilot</div>
              <div style={{ fontSize: "11px", color: "#10b981" }}>Búsqueda Semántica Vectorial Activa</div>
            </div>
          </div>

          {/* Messages Viewport */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  backgroundColor: m.role === "user" ? "#e50914" : "#232730",
                  color: "#fff",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  lineHeight: "1.4",
                }}
              >
                <div>{m.text}</div>
                {m.recommendations && m.recommendations.length > 0 && (
                  <div style={{ marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "8px" }}>
                    <div style={{ fontSize: "11px", opacity: 0.8, marginBottom: "4px" }}>Match Semántico:</div>
                    {m.recommendations.map((rec, rIdx) => (
                      <div
                        key={rIdx}
                        style={{
                          backgroundColor: "#16191f",
                          padding: "6px 8px",
                          borderRadius: "4px",
                          marginBottom: "4px",
                          fontSize: "12px",
                        }}
                      >
                        <strong>{rec.title}</strong> — {Math.round(rec.match_score * 100)}%
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{rec.reason}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ color: "#9ca3af", fontSize: "12px", fontStyle: "italic" }}>
                Otaku Copilot está pensando...
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={handleSend}
            style={{
              padding: "12px",
              backgroundColor: "#1c212b",
              borderTop: "1px solid #282f3d",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              type="text"
              placeholder="Ej. un anime corto con drama y misterio..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #374151",
                backgroundColor: "#11141a",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "#e50914",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
