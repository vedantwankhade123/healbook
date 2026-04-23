import "../load-env.js";
import { adminDb } from "../firebase-admin.js";

async function cleanupMocks() {
  console.log("Starting mock cleanup...");
  
  // 1. Find all users with isMock: true
  const usersSnap = await adminDb.collection("users").where("isMock", "==", true).get();
  console.log(`Found ${usersSnap.size} mock users.`);

  let count = 0;
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    
    // Delete doctor profile
    await adminDb.collection("doctors").doc(uid).delete();
    
    // Delete user
    await userDoc.ref.delete();
    
    count++;
    if (count % 50 === 0) console.log(`Deleted ${count} mocks...`);
  }

  console.log(`Cleanup complete. Total ${count} mock accounts removed.`);
  process.exit(0);
}

cleanupMocks().catch(err => {
  console.error(err);
  process.exit(1);
});
