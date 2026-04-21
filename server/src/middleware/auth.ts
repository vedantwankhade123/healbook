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
      res.status(503).json({ error: "Auth service unavailable. Check server environment config." });
      return;
    }
    const decoded = await auth.verifyIdToken(token);
    req.uid = decoded.uid;
    req.decodedToken = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
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
