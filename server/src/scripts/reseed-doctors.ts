import "../load-env.js";
import { adminDb, adminAuth } from "../firebase-admin.js";
import { generateExtendedDataset } from "../data/doctors-seed.js";
import { FieldValue } from "firebase-admin/firestore";

async function reseedDoctors() {
  console.log("Starting doctor re-seed with updated email format...");
  const { doctors } = generateExtendedDataset();
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const docData of doctors) {
    try {
      if (typeof docData.email !== "string" || typeof docData.name !== "string") {
        continue;
      }

      let authUser;
      try {
        // Check if user already exists in Firebase Auth
        authUser = await adminAuth.getUserByEmail(docData.email);
        // User exists, update doctor profile
        const uid = authUser.uid;
        await adminDb.collection("doctors").doc(uid).set({
          ...docData,
          userId: uid,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        skipCount++;
        continue;
      } catch (e: unknown) {
        const err = e as { code?: string };
        if (err.code === "auth/user-not-found") {
          // Create new Firebase Auth user
          authUser = await adminAuth.createUser({
            email: docData.email as string,
            password: "password123",
            displayName: docData.name as string,
            photoURL: docData.profilePhoto as string,
          });
        } else {
          throw e;
        }
      }

      const uid = authUser.uid;

      // Create user document
      await adminDb
        .collection("users")
        .doc(uid)
        .set({
          name: docData.name,
          email: docData.email,
          role: "doctor",
          profilePhoto: docData.profilePhoto,
          createdAt: new Date(),
        });

      // Create doctor profile
      await adminDb
        .collection("doctors")
        .doc(uid)
        .set({
          ...docData,
          userId: uid,
          createdAt: new Date(),
          isAvailable: docData.isAvailable ?? true,
          rating: docData.rating ?? 4.5,
          reviewsCount: Math.floor(Math.random() * 500) + 50,
        });

      successCount++;
    } catch (err) {
      console.error(`Error seeding doctor ${docData.email}:`, err);
      errorCount++;
    }
  }

  console.log("\n✅ Re-seed completed!");
  console.log(`📊 Results:`);
  console.log(`   - New accounts created: ${successCount}`);
  console.log(`   - Existing accounts updated: ${skipCount}`);
  console.log(`   - Errors: ${errorCount}`);
  console.log(`\n🔐 All doctors can login with:`);
  console.log(`   Email: firstname.lastname@healbook.in`);
  console.log(`   Password: password123`);
  
  process.exit(0);
}

reseedDoctors().catch(err => {
  console.error(err);
  process.exit(1);
});
