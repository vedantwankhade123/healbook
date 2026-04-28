import "../load-env.js";
import { adminAuth } from "../firebase-admin.js";

async function verifyDoctorLogin() {
  console.log("Verifying doctor accounts...\n");
  
  // Test a few sample emails
  const testEmails = [
    "ananya.sharma@healbook.in",
    "rahul.malhotra@healbook.in",
    "amit.sharma@healbook.in",
    "neha.gupta@healbook.in",
  ];

  for (const email of testEmails) {
    try {
      const user = await adminAuth.getUserByEmail(email);
      console.log(`✅ ${email}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Display Name: ${user.displayName}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log("");
    } catch (err: any) {
      console.log(`❌ ${email} - ${err.message}`);
      console.log("");
    }
  }

  console.log("\n🔐 All doctors login with:");
  console.log("   Email: firstname.lastname@healbook.in");
  console.log("   Password: password123");
  
  process.exit(0);
}

verifyDoctorLogin().catch(err => {
  console.error(err);
  process.exit(1);
});
