import serverless from "serverless-http";
import { app } from "./app.js";

// Export the handler for Netlify Functions
// Standard ESM export that is widely supported by esbuild and Netlify
export const handler = serverless(app);

