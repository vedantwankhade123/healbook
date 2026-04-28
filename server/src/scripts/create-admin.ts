import "../load-env.js";
import { adminDb, adminAuth } from "../firebase-admin.js";

async function createAdminAccount() {
  console.log("Creating admin account...");
  
  const adminEmail = "admin@healbook.in";
  const adminPassword = "admin123";
  const adminName = "System Administrator";

  try {
    // Check if admin already exists
    let authUser;
    try {
      authUser = await adminAuth.getUserByEmail(adminEmail);
      console.log(`✅ Admin account already exists: ${adminEmail}`);
      console.log(`   UID: ${authUser.uid}`);
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "auth/user-not-found") {
        // Create admin Firebase Auth account
        authUser = await adminAuth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: adminName,
          emailVerified: true,
        });
        console.log(`✅ Created admin Firebase Auth account`);
      } else {
        throw e;
      }
    }

    const uid = authUser.uid;

    // Create/update user document with admin role
    await adminDb
      .collection("users")
      .doc(uid)
      .set({
        name: adminName,
        email: adminEmail,
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

    console.log(`✅ Admin user document created in Firestore`);
    console.log(`\n🔐 Admin Login Credentials:`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`\n⚠️  Please change the password after first login!`);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin account:", err);
    process.exit(1);
  }
}

createAdminAccount().catch(err => {
  console.error(err);
  process.exit(1);
});
