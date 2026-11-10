import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let hasLoggedOffline = false;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 1) {
        if (!hasLoggedOffline) {
          console.log("[Platform-X Redis] Running in offline mode (cache disabled).");
          hasLoggedOffline = true;
        }
        return false; // Stop reconnecting after 1 retry
      }
      return 300;
    },
  },
});

redisClient.on("error", (err) => {
  if (!hasLoggedOffline) {
    console.log("[Platform-X Redis] Running in offline mode (cache disabled).");
    hasLoggedOffline = true;
  }
});

export async function initRedis() {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log("[Platform-X Redis] Connected successfully.");
    }
  } catch (err: any) {
    if (!hasLoggedOffline) {
      console.log("[Platform-X Redis] Running in offline mode (cache disabled).");
      hasLoggedOffline = true;
    }
  }
}
