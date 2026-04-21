import "./load-env.js";
import express from "express";
import cors from "cors";
import { createApiRouter } from "./routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, source: "lambda" });
});

app.use("/api", createApiRouter());

export { app };
