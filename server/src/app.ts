import "./load-env.js";
import "express-async-errors";
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

// Global Error Handler to prevent 502 crashes on Netlify
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ GLOBAL ERROR:", err);
  
  // Distinguish between initialization errors and request errors
  const isAuthInitError = err.message?.includes("Firebase Admin Auth not initialized");
  const isDbInitError = err.message?.includes("Firebase Admin Firestore not initialized");
  
  if (isAuthInitError || isDbInitError) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: err.message,
      suggestion: "Check Netlify environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)."
    });
  }

  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});


export { app };
