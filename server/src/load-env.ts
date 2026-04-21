import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/** Monorepo root `.env.local` (same file Vite uses for the client). */
try {
  const isNetlify = process.env.NETLIFY === "true" || !!process.env.NETLIFY;
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd && !isNetlify) {
    // Only use import.meta and path logic if we are strictly in a local dev environment
    if (typeof import.meta !== "undefined" && import.meta.url) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const root = path.resolve(__dirname, "../..");
      
      dotenv.config({ path: path.join(root, ".env.local") });
      dotenv.config({ path: path.join(root, ".env") });
    }
  }
} catch (e) {
  console.warn("⚠️ load-env: Failed to load local .env files, continuing with system environment variables.");
}


