import serverless from "serverless-http";
import { app } from "./app.js";

// Export the handler for Netlify Functions
export const handler = serverless(app);
