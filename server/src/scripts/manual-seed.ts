import "../load-env.js";
import { adminDb } from "../firebase-admin.js";
import { generateExtendedDataset } from "../data/doctors-seed.js";
import { FieldValue } from "firebase-admin/firestore";

async function manualSeed() {
  console.log("Starting manual seed...");
  const { doctors, facilities } = generateExtendedDataset();
  
  let facilityCount = 0;
  let successCount = 0;

  // 1. Seed Facilities
  for (const facility of facilities) {
    if (typeof facility.id !== "string") {
      continue;
    }

    await adminDb.collection("facilities").doc(facility.id).set({
      ...facility,
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });
    facilityCount++;
  }
  console.log(`Seeded ${facilityCount} facilities.`);

  // 2. Seed Doctors
  for (const docData of doctors) {
    if (typeof docData.email !== "string" || typeof docData.name !== "string") {
      continue;
    }

    // Check if user exists by email
    const userSnap = await adminDb.collection("users").where("email", "==", docData.email).limit(1).get();
    
    let uid: string;
    if (!userSnap.empty) {
      uid = userSnap.docs[0].id;
    } else {
      // Create a mock user if they don't exist
      const userRef = adminDb.collection("users").doc();
      uid = userRef.id;
      await userRef.set({
        email: docData.email,
        displayName: docData.name,
        role: "doctor",
        photoURL: typeof docData.profilePhoto === "string" ? docData.profilePhoto : "",
        createdAt: FieldValue.serverTimestamp(),
        isMock: true // Mark as mock for future cleanup if needed
      });
    }

    // Upsert Doctor Profile
    await adminDb.collection("doctors").doc(uid).set({
      ...docData,
      userId: uid,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    
    successCount++;
  }
  console.log(`Successfully synced ${successCount} doctors to Firestore.`);
  process.exit(0);
}

manualSeed().catch(err => {
  console.error(err);
  process.exit(1);
});
