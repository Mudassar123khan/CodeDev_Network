process.env.NODE_ENV = "test";

import http from "node:http";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { closeCache } from "../services/cache.service.js";

dotenv.config();

export const TEST_JWT_SECRET = process.env.JWT_SECRET || "CodeDevNetwork";

export function generateToken(payload = {}) {
  return jwt.sign(
    {
      id: payload.id || "6a5228ab9e5b3bdd2ecfb514",
      role: payload.role || "admin",
    },
    TEST_JWT_SECRET,
    { expiresIn: "1h" }
  );
}

let app = null;
let serverInstance = null;
let serverBaseUrl = null;

export async function startTestServer() {
  if (!app) {
    const mod = await import("../app.js");
    app = mod.default;
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URL);
  }

  if (!serverInstance) {
    await new Promise((resolve) => {
      serverInstance = http.createServer(app);
      serverInstance.listen(0, "127.0.0.1", () => {
        const port = serverInstance.address().port;
        serverBaseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  }

  return { server: serverInstance, baseUrl: serverBaseUrl };
}

export async function stopTestServer() {
  if (serverInstance) {
    await new Promise((resolve) => {
      serverInstance.close(resolve);
    });
    serverInstance = null;
    serverBaseUrl = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await closeCache();

  try {
    const queueMod = await import("../services/bullMQ.queue.js");
    if (queueMod?.default?.close) {
      await queueMod.default.close();
    }
  } catch (err) {
    // Ignore
  }
}


