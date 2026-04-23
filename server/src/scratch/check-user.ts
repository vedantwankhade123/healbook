import { adminDb } from "../firebase-admin.js";
import "../load-env.js";

async function checkUser() {
  const name = "vedant wankhade";
  const snap = await adminDb.collection("users").where("role", "==", "patient").get();
  const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log("Found patients:", users.map(u => u.name));
  
  const founds = users.filter(u => {
    const n1 = String(u.name || "").toLowerCase();
    const n2 = name.toLowerCase();
    return n1.includes(n2) || n2.includes(n1);
  });
  
  for (const found of founds) {
    console.log("Checking Vedant UID:", found.id);
    const recordsSnap = await adminDb.collection("medical_records").where("userId", "==", found.id).get();
    console.log("Records found for this UID:", recordsSnap.size);
    recordsSnap.docs.forEach(d => console.log("- ", d.data().title, d.data().fileUrl));
  }
  process.exit(0);
}

checkUser();
