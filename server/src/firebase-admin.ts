import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ CRITICAL: Missing Firebase Admin environment variables!");
  } else {
    try {
      // Robust private key parsing: handles literal \n, double-escaped \\n, and actual newlines
      const formattedKey = privateKey
        .replace(/\\n/g, "\n")
        .replace(/\n\s*\n/g, "\n"); // Remove empty lines which can cause issues

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      });
      console.log("✅ Firebase Admin initialized successfully.");
    } catch (error) {
      console.error("❌ Firebase admin initialization error:", error);
    }
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
