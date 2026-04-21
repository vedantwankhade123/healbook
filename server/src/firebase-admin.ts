import admin from "firebase-admin";

let isInitialized = false;

function initializeFirebase() {
  if (isInitialized) return;
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ CRITICAL: Missing Firebase Admin environment variables!");
    return;
  }

  try {
    // Robust private key parsing
    const formattedKey = privateKey
      .replace(/\\n/g, "\n")
      .replace(/\n\s*\n/g, "\n");

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      });
    }
    isInitialized = true;
    console.log("✅ Firebase Admin initialized successfully.");
  } catch (error) {
    console.error("❌ Firebase admin initialization error:", error);
  }
}

export const getAdminAuth = () => {
  initializeFirebase();
  if (!isInitialized) return null;
  return admin.auth();
};

export const getAdminDb = () => {
  initializeFirebase();
  if (!isInitialized) return null;
  return admin.firestore();
};

/** 
 * PROXY FIX: These smart constants act like live getters.
 * They forward all calls to the real Firebase instance, ensuring it's initialized first.
 */
export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_, prop) {
    const auth = getAdminAuth();
    if (!auth) throw new Error("Firebase Admin Auth not initialized. Check Netlify Environment Variables.");
    return (auth as any)[prop];
  }
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_, prop) {
    const db = getAdminDb();
    if (!db) throw new Error("Firebase Admin Firestore not initialized. Check Netlify Environment Variables.");
    return (db as any)[prop];
  }
});
