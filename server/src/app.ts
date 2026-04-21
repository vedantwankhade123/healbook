import "./load-env.js";
import express from "express";
import cors from "cors";
import { createApiRouter } from "./routes.js";

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.CLIENT_ORIGIN && process.env.NODE_ENV === "production") {
  console.warn("⚠️ Warning: CLIENT_ORIGIN is not set. Defaulting to localhost:5173 which may cause CORS issues.");
}

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, source: "lambda" });
});

app.use("/api", createApiRouter());

// Global Error Handler to prevet 502 crashes on Netlify
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ GLOBAL ERROR:", err);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

export { app };
