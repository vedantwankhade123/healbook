import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";

export const PRAKRITI_SYSTEM_PROMPT = `
You are Prakriti, a highly intelligent, empathetic, and clinically responsible AI Health Assistant for the HealBook platform.
Your role is to help patients and doctors navigate the platform, answer health-related questions, and suggest appropriate care.

Core behavior:
1. Always respond as Prakriti.
2. Never claim to provide a confirmed diagnosis.
3. Use tools and live context when recommending doctors or explaining the platform.
4. If symptoms suggest a medical emergency, clearly tell the patient to seek urgent in-person care immediately.
5. Keep responses concise and well structured (bullets). Max 3–4 short paragraphs unless listing data.
6. The Prakriti agent may use server tools to read/write the user’s HealBook data when the user is authenticated.

Voice & Language:
- Adapt tone and language (Hindi/English). Maintain a warm, professional Indian persona.
`;

export async function buildAllDoctorsContext(db: Firestore): Promise<string> {
  try {
    const snapshot = await db.collection("doctors").get();
    const doctors = snapshot.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      return `- ID: ${doc.id} | Name: ${d.name} | Spec: ${d.specialization} | Clinic: ${d.clinicName} | Fee: INR ${d.consultationFee}`;
    });

    return `
─── HEALBOOK DOCTOR REGISTRY ───
${doctors.join("\n")}
────────────────────────────────
`;
  } catch (err) {
    console.error("Failed to build doctor context:", err);
    return "";
  }
}

export async function buildSystemStatsContext(db: Firestore): Promise<string> {
  try {
    const [users, doctors, appointments, reviews, payments] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("doctors").count().get(),
      db.collection("appointments").count().get(),
      db.collection("reviews").count().get(),
      db.collection("payments").count().get(),
    ]);

    return `
─── SYSTEM WIDE STATISTICS ───
- Total Users: ${users.data().count}
- Registered Doctors: ${doctors.data().count}
- Total Appointments Handled: ${appointments.data().count}
- Patient Reviews: ${reviews.data().count}
- Total Successful Transactions: ${payments.data().count}
──────────────────────────────
`;
  } catch {
    return "";
  }
}

export async function buildUserContext(db: Firestore, userId: string): Promise<string> {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return "";

    const data = userDoc.data() as Record<string, unknown>;
    const fields: string[] = [
      `User ID: ${userId}`,
      data.name ? `Name: ${data.name}` : null,
      data.email ? `Email: ${data.email}` : null,
      data.role ? `Role: ${data.role}` : null,
      data.phoneNumber ? `Phone: ${data.phoneNumber}` : null,
      data.gender ? `Gender: ${data.gender}` : null,
      data.age ? `Age: ${data.age}` : null,
      data.bloodGroup ? `Blood Group: ${data.bloodGroup}` : null,
      data.height ? `Height: ${data.height}` : null,
      data.weight ? `Weight: ${data.weight}` : null,
      data.allergies ? `Known Allergies: ${data.allergies}` : null,
      data.medicalConditions ? `Medical Conditions: ${data.medicalConditions}` : null,
    ].filter(Boolean) as string[];

    if (data.role === "doctor") {
      const doctorSnap = await db.collection("doctors").where("userId", "==", userId).limit(1).get();
      if (!doctorSnap.empty) {
        const doc = doctorSnap.docs[0].data();
        fields.push(
          `Doctor Profile ID: ${doctorSnap.docs[0].id}`,
          doc.specialization ? `Specialization: ${doc.specialization}` : "",
          doc.experience ? `Experience: ${doc.experience} years` : "",
          doc.clinicName ? `Clinic: ${doc.clinicName}` : "",
          doc.rating ? `Rating: ${doc.rating}` : "",
        );
      }
    }

    try {
      const apptSnap = await db
        .collection("appointments")
        .where("patientId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (!apptSnap.empty) {
        const appointments = apptSnap.docs.map((d) => {
          const a = d.data();
          return `  - ${a.doctorName || "Unknown"} (${a.doctorSpecialization || "N/A"}) on ${a.date} at ${a.time} — Status: ${a.status}`;
        });
        fields.push(`Recent Appointments:\n${appointments.join("\n")}`);
      }
    } catch {
      // index may be missing
    }

    try {
      const recordsSnap = await db
        .collection("medical_records")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (!recordsSnap.empty) {
        const records = recordsSnap.docs.map((d) => {
          const r = d.data();
          const desc = String(r.description || "").substring(0, 100);
          return `  - ${r.title || "Untitled"} (${r.type || "note"}) on ${r.date || "unknown date"}: ${desc}${String(r.description || "").length > 100 ? "..." : ""}`;
        });
        fields.push(`Recent Medical Records:\n${records.join("\n")}`);
      }
    } catch {
      // index may be missing
    }

    const name = (data.name as string) || "Patient";
    return `
─── CURRENT USER CONTEXT ───
${fields.join("\n")}
IMPORTANT: You are speaking with ${name} (User ID: ${userId}).
─────────────────────────────
`;
  } catch (err) {
    console.error("Failed to build user context:", err);
    return "";
  }
}

export { FieldValue };
