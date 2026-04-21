import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { createUserNotification } from "./notifications.js";

export type ConfirmPayResult =
  | { ok: true; id: string; data: Record<string, unknown> }
  | { ok: false; status: number; error: string };

export async function confirmAppointmentPayment(
  db: Firestore,
  appointmentId: string,
  patientUid: string,
): Promise<ConfirmPayResult> {
  const ref = db.collection("appointments").doc(appointmentId);
  const doc = await ref.get();
  if (!doc.exists) return { ok: false, status: 404, error: "Not found" };
  const data = doc.data()!;
  if (data.patientId !== patientUid) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  if (data.status !== "pending") {
    return { ok: false, status: 400, error: "Only pending appointments can be paid to confirm" };
  }
  if (data.paymentStatus === "paid") {
    return { ok: false, status: 400, error: "Already paid" };
  }
  await ref.update({
    status: "confirmed",
    paymentStatus: "paid",
    paidAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const next = await ref.get();
  const payload: Record<string, unknown> = { id: next.id, ...next.data() };
  
  // Notify Patient
  await createUserNotification(
    db,
    patientUid,
    "Payment received",
    `${String(data.doctorName || "Your doctor")} on ${String(data.date)} — your booking is confirmed.`,
    "payment",
  );

  // Notify Doctor
  try {
    const doctorId = data.doctorId as string;
    if (doctorId) {
      const ddoc = await db.collection("doctors").doc(doctorId).get();
      if (ddoc.exists) {
        const ddata = ddoc.data()!;
        if (ddata.userId) {
          await createUserNotification(
            db,
            ddata.userId,
            "Payment Confirmed",
            `Consultation fee for ${String(data.patientName || "your patient")} on ${String(data.date)} has been confirmed!`,
            "payment"
          );
        }
      }
    }
  } catch (e) {
    console.error("Error creating doctor payment notification:", e);
  }

  return { ok: true, id: next.id, data: payload };
}
