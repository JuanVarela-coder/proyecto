import express, { Request, Response } from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import dotenv from "dotenv";

import animeRoutes from "./routes/animeRoutes";
import historyRoutes from "./routes/historyRoutes";
import commentRoutes from "./routes/commentRoutes";
import { initRedis } from "./config/redis";

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const PORT = process.env.API_PORT || 4000;

app.use(cors());
app.use(express.json());

// Initialize Background services
initRedis();

// API Routes
app.use("/api", animeRoutes);
app.use("/api", historyRoutes);
app.use("/api", commentRoutes);

// Healthcheck endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "platform-x-api",
    websocket_clients: wss.clients.size,
    timestamp: new Date().toISOString(),
  });
});

// WebSocket Server for Live Comments & Community Chat
wss.on("connection", (ws: WebSocket) => {
  console.log("[WebSocket] Client connected. Total:", wss.clients.size);

  ws.send(JSON.stringify({
    type: "CONNECTED",
    message: "Connected to Platform-X Live Event Bus",
  }));

  ws.on("message", (rawMessage: string) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      
      // Broadcast live comments to other connected viewers
      if (data.type === "NEW_COMMENT") {
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "BROADCAST_COMMENT",
              comment: data.comment,
            }));
          }
        });
      }
    } catch (e) {
      console.error("[WebSocket] Malformed message:", e);
    }
  });

  ws.on("close", () => {
    console.log("[WebSocket] Client disconnected. Total:", wss.clients.size);
  });
});

server.listen(PORT, () => {
  console.log(`[Platform-X API] running on http://localhost:${PORT}`);
  console.log(`[Platform-X WebSocket] running on ws://localhost:${PORT}/ws`);
});
