import type { Request, Response, NextFunction } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "../firebase-admin.js";

export interface AuthedRequest extends Request {
  uid?: string;
  decodedToken?: DecodedIdToken;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = header.slice(7);
  try {
    const auth = getAdminAuth();
    if (!auth) {
      console.error("❌ Auth service unavailable. Firebase Admin may not be initialized correctly.");
      res.status(503).json({ 
        error: "Auth service unavailable",
        message: "The authentication service is not responding. This usually means the server environment variables are missing or incorrectly formatted."
      });
      return;
    }
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;
    req.decodedToken = decoded;
    next();
  } catch (error) {
    console.error("❌ Auth verification error:", error);
    res.status(401).json({ 
      error: "Invalid or expired token",
      message: error instanceof Error ? error.message : "Token verification failed"
    });
  }

}

export async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = header.slice(7);
  try {
    const auth = getAdminAuth();
    if (auth) {
      const decoded = await auth.verifyIdToken(token);
      req.uid = decoded.uid;
    }
  } catch {
    req.uid = undefined;
  }
  next();
}
