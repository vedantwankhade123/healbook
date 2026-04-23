import {
  GoogleGenerativeAI,
  SchemaType,
  FunctionCallingMode,
  type FunctionDeclaration,
} from "@google/generative-ai";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { buildUserContext } from "./lib/prakriti.js";
import { createUserNotification } from "./lib/notifications.js";
import { confirmAppointmentPayment } from "./lib/confirmAppointmentPayment.js";

const AGENT_SYSTEM = `
You are Prakriti, HealBook's AI health assistant with LIVE access to the platform database through tools.
You MUST use tools whenever the user asks about their data, doctors, appointments, bookings, records, or platform stats.
Never claim you cannot access their account when they are logged in — call get_session and get_my_profile first if unsure.

Session rules:
- The server binds every tool to the authenticated Firebase user (session). Never invent user IDs.
- For booking, cancelling, or editing data, the patient must be logged in; tools will enforce this.

Booking and payments:
- After book_appointment succeeds, clearly say the slot is held but payment is required to confirm. Tell them they can tap **Pay now** on the payment card shown in this chat.
- If the user asks to pay, confirm payment, or "I've paid", call pay_appointment_fee with the correct appointmentId.

Visual Excellence and Redundancy:
- The platform automatically generates beautiful UI cards for Doctors, Hospitals, and Appointments when tools are called.
- DO NOT repeat the details of these items (fees, ratings, addresses, experience) in your text response. 
- Keep your text response brief and conversational, pointing the user to the cards below.
- You have access to maps! Use **get_map_route** to help patients find the clinic and see the best route via OpenStreetMap. Mention that you've provided a map link for them.

Medical safety:
- Do not give a definitive diagnosis. Advise urgent care for emergencies.
- Be concise, warm, and clear (bullets). Prefer actionable next steps.

After tools return, summarize the status briefly in natural language. If a tool errors, explain briefly and suggest what they can do next.
`;

export type PrakritiPaymentPrompt = {
  appointmentId: string;
  fee: number;
  doctorName: string;
  date: string;
  time: string;
  visitType?: string;
};

export type PrakritiAgentReply = {
  text: string;
  paymentPrompts?: PrakritiPaymentPrompt[];
  uiCards?: PrakritiUiCard[];
};

export type PrakritiUiCard =
  | {
      kind: "doctor";
      id: string;
      name: string;
      specialization?: string;
      hospitalOrClinic?: string;
      fee?: number;
      rating?: number;
    }
  | {
      kind: "hospital";
      id: string;
      name: string;
      location?: string;
    }
  | {
      kind: "appointment";
      id: string;
      doctorName?: string;
      date?: string;
      time?: string;
      status?: string;
      paymentStatus?: string;
      fee?: number;
    }
  | {
      kind: "status";
      id: string;
      title: string;
      value: string;
      tone?: "neutral" | "success" | "warning";
    };

function mergePaymentPrompts(acc: PrakritiPaymentPrompt[], more: PrakritiPaymentPrompt[]) {
  const seen = new Set(acc.map((p) => p.appointmentId));
  for (const p of more) {
    if (p.appointmentId && !seen.has(p.appointmentId)) {
      acc.push(p);
      seen.add(p.appointmentId);
    }
  }
}

function mergeUiCards(acc: PrakritiUiCard[], more: PrakritiUiCard[]) {
  const seen = new Set(acc.map((c) => `${c.kind}:${c.id}`));
  for (const c of more) {
    const key = `${c.kind}:${c.id}`;
    if (!seen.has(key)) {
      acc.push(c);
      seen.add(key);
    }
  }
}

function paymentPromptsFromToolResult(
  name: string,
  out: Record<string, unknown>,
): PrakritiPaymentPrompt[] {
  if (name === "book_appointment" && out.success && out.appointmentId) {
    return [
      {
        appointmentId: String(out.appointmentId),
        fee: Number(out.fee ?? 0),
        doctorName: String(out.doctorName ?? "Doctor"),
        date: String(out.date ?? ""),
        time: String(out.time ?? ""),
        visitType: String(out.visitType ?? "in-person"),
      },
    ];
  }
  if (name === "list_my_appointments" && Array.isArray(out.appointments)) {
    return (out.appointments as Record<string, unknown>[])
      .filter((a) => a.status === "pending" && a.paymentStatus !== "paid")
      .map((a) => ({
        appointmentId: String(a.id ?? ""),
        fee: Number(a.fee ?? 0),
        doctorName: String(a.doctorName ?? "Doctor"),
        date: String(a.date ?? ""),
        time: String(a.time ?? ""),
        visitType: String(a.visitType ?? "in-person"),
      }))
      .filter((p) => p.appointmentId);
  }
  return [];
}

function uiCardsFromToolResult(name: string, out: Record<string, unknown>): PrakritiUiCard[] {
  if (name === "search_doctors" && Array.isArray(out.doctors)) {
    return (out.doctors as Record<string, unknown>[])
      .slice(0, 6)
      .flatMap((d) => {
        const cards: PrakritiUiCard[] = [
          {
            kind: "doctor",
            id: String(d.id ?? d.userId ?? d.name ?? Math.random()),
            name: String(d.name ?? "Doctor"),
            specialization: d.specialization ? String(d.specialization) : undefined,
            hospitalOrClinic: d.clinicName ? String(d.clinicName) : undefined,
            fee: d.consultationFee !== undefined ? Number(d.consultationFee) : undefined,
            rating: d.rating !== undefined ? Number(d.rating) : undefined,
          },
        ];
        if (d.clinicName) {
          cards.push({
            kind: "hospital",
            id: `clinic-${String(d.id ?? d.clinicName)}`,
            name: String(d.clinicName),
          });
        }
        return cards;
      });
  }

  if (name === "suggest_doctors_for_concern" && Array.isArray(out.suggestions)) {
    return (out.suggestions as Record<string, unknown>[])
      .slice(0, 6)
      .map((d) => ({
        kind: "doctor" as const,
        id: String(d.id ?? d.name ?? Math.random()),
        name: String(d.name ?? "Doctor"),
        specialization: d.specialization ? String(d.specialization) : undefined,
        hospitalOrClinic: d.clinicName ? String(d.clinicName) : undefined,
        fee: d.consultationFee !== undefined ? Number(d.consultationFee) : undefined,
        rating: d.rating !== undefined ? Number(d.rating) : undefined,
      }));
  }

  if (name === "get_doctor" && out.id) {
    const cards: PrakritiUiCard[] = [
      {
        kind: "doctor",
        id: String(out.id),
        name: String(out.name ?? "Doctor"),
        specialization: out.specialization ? String(out.specialization) : undefined,
        hospitalOrClinic: out.clinicName ? String(out.clinicName) : undefined,
        fee: out.consultationFee !== undefined ? Number(out.consultationFee) : undefined,
        rating: out.rating !== undefined ? Number(out.rating) : undefined,
      },
    ];
    if (out.clinicName) {
      cards.push({
        kind: "hospital",
        id: `clinic-${String(out.id)}`,
        name: String(out.clinicName),
      });
    }
    return cards;
  }

  if (name === "list_my_appointments" && Array.isArray(out.appointments)) {
    return (out.appointments as Record<string, unknown>[])
      .slice(0, 8)
      .map((a) => ({
        kind: "appointment" as const,
        id: String(a.id ?? Math.random()),
        doctorName: a.doctorName ? String(a.doctorName) : undefined,
        date: a.date ? String(a.date) : undefined,
        time: a.time ? String(a.time) : undefined,
        status: a.status ? String(a.status) : undefined,
        paymentStatus: a.paymentStatus ? String(a.paymentStatus) : undefined,
        fee: a.fee !== undefined ? Number(a.fee) : undefined,
      }));
  }

  if (name === "book_appointment" && out.success && out.appointmentId) {
    return [
      {
        kind: "appointment",
        id: String(out.appointmentId),
        doctorName: out.doctorName ? String(out.doctorName) : undefined,
        date: out.date ? String(out.date) : undefined,
        time: out.time ? String(out.time) : undefined,
        status: "pending",
        paymentStatus: out.paymentStatus ? String(out.paymentStatus) : "pending",
        fee: out.fee !== undefined ? Number(out.fee) : undefined,
      },
    ];
  }

  if (name === "pay_appointment_fee" && out.success && out.appointmentId) {
    return [
      {
        kind: "status",
        id: `pay-${String(out.appointmentId)}`,
        title: "Payment status",
        value: "Paid and confirmed",
        tone: "success",
      },
    ];
  }

  if (name === "cancel_appointment" && out.success) {
    return [
      {
        kind: "status",
        id: `cancel-${Date.now()}`,
        title: "Appointment status",
        value: "Cancelled",
        tone: "warning",
      },
    ];
  }

  if (name === "reschedule_appointment" && out.success) {
    return [
      {
        kind: "status",
        id: `reschedule-${Date.now()}`,
        title: "Appointment status",
        value: String(out.message ?? "Rescheduled"),
        tone: "neutral",
      },
    ];
  }

  if (name === "get_system_stats" && !out.error) {
    return [
      { kind: "status", id: "stats-users", title: "Users", value: String(out.totalUsers ?? 0) },
      { kind: "status", id: "stats-doctors", title: "Doctors", value: String(out.totalDoctors ?? 0) },
      { kind: "status", id: "stats-appointments", title: "Appointments", value: String(out.totalAppointments ?? 0) },
    ];
  }

  return [];
}

export type ChatTurn = { role: "user" | "assistant"; text: string };

function toolDeclarations(): FunctionDeclaration[] {
  return [
    {
      name: "get_session",
      description: "Returns the current logged-in user id, email, name, and role from the server session.",
      parameters: { type: SchemaType.OBJECT, properties: {} },
    },
    {
      name: "get_my_profile",
      description: "Loads the full profile document for the logged-in user.",
      parameters: { type: SchemaType.OBJECT, properties: {} },
    },
    {
      name: "update_my_profile",
      description: "Updates allowed fields on the logged-in patient's profile.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          phoneNumber: { type: SchemaType.STRING },
          age: { type: SchemaType.NUMBER },
          gender: { type: SchemaType.STRING },
          bloodGroup: { type: SchemaType.STRING },
          height: { type: SchemaType.STRING },
          weight: { type: SchemaType.STRING },
          allergies: { type: SchemaType.STRING },
          medicalConditions: { type: SchemaType.STRING },
          address: { type: SchemaType.STRING },
          emergencyContact: { type: SchemaType.STRING },
        },
      },
    },
    {
      name: "search_doctors",
      description: "Search doctors by specialization and/or name substring. Returns a list with ids, fees, ratings.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          specialization: { type: SchemaType.STRING },
          nameQuery: { type: SchemaType.STRING },
          limit: { type: SchemaType.NUMBER },
        },
      },
    },
    {
      name: "get_doctor",
      description: "Get one doctor by Firestore document id.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: { doctorId: { type: SchemaType.STRING } },
        required: ["doctorId"],
      },
    },
    {
      name: "suggest_doctors_for_concern",
      description:
        "Rank doctors for a free-text symptom or concern (e.g. chest pain, skin rash). Uses specialization, treats[], rating.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          concern: { type: SchemaType.STRING },
          limit: { type: SchemaType.NUMBER },
        },
        required: ["concern"],
      },
    },
    {
      name: "list_my_appointments",
      description: "List appointments for the current user (patient: as patient; doctor: as doctor). Optional status filter.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          status: {
            type: SchemaType.STRING,
            description: "pending | confirmed | cancelled | completed | expired",
          },
          limit: { type: SchemaType.NUMBER },
        },
      },
    },
    {
      name: "book_appointment",
      description:
        "Book an appointment for the logged-in patient. Use doctorId from search/get_doctor. date=YYYY-MM-DD, time like 10:30 AM or 14:00.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          doctorId: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
          time: { type: SchemaType.STRING },
          visitType: { type: SchemaType.STRING, description: "video | home | in-person" },
          reason: { type: SchemaType.STRING },
          fee: { type: SchemaType.NUMBER },
        },
        required: ["doctorId", "date", "time", "visitType", "reason"],
      },
    },
    {
      name: "pay_appointment_fee",
      description:
        "Confirm consultation payment for a pending appointment (marks it confirmed/booked). Use appointmentId from list_my_appointments or a recent book_appointment result.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: { appointmentId: { type: SchemaType.STRING } },
        required: ["appointmentId"],
      },
    },
    {
      name: "cancel_appointment",
      description: "Cancel an appointment belonging to the current patient.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: { appointmentId: { type: SchemaType.STRING } },
        required: ["appointmentId"],
      },
    },
    {
      name: "reschedule_appointment",
      description: "Reschedule a patient's appointment to a new date/time.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          appointmentId: { type: SchemaType.STRING },
          newDate: { type: SchemaType.STRING },
          newTime: { type: SchemaType.STRING },
        },
        required: ["appointmentId", "newDate", "newTime"],
      },
    },
    {
      name: "list_my_medical_records",
      description: "List medical records for the logged-in patient.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: { limit: { type: SchemaType.NUMBER } },
      },
    },
    {
      name: "create_medical_record",
      description: "Create a medical record for the logged-in patient.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          date: { type: SchemaType.STRING },
        },
        required: ["title", "type", "description"],
      },
    },
    {
      name: "get_system_stats",
      description: "Platform-wide counts: users, doctors, appointments, reviews, payments.",
      parameters: { type: SchemaType.OBJECT, properties: {} },
    },
    {
      name: "get_map_route",
      description: "Generates an OpenStreetMap search and directions link for a doctor's clinic or hospital.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          destinationName: { type: SchemaType.STRING, description: "The clinic or hospital name." },
          address: { type: SchemaType.STRING, description: "The physical address of the facility." },
        },
        required: ["destinationName"],
      },
    },
  ];
}

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function executePrakritiTool(
  db: Firestore,
  name: string,
  args: Record<string, unknown>,
  sessionUid: string | undefined,
  userRole: string | undefined,
): Promise<Record<string, unknown>> {
  const needLogin = () => ({ error: "Not logged in. Ask the user to sign in." });
  const needPatient = () => ({ error: "This action requires a patient account." });

  switch (name) {
    case "get_session": {
      if (!sessionUid) return { guest: true };
      const u = await db.collection("users").doc(sessionUid).get();
      const d = u.data() || {};
      return {
        uid: sessionUid,
        email: d.email ?? null,
        name: d.name ?? null,
        role: d.role ?? null,
      };
    }
    case "get_my_profile": {
      if (!sessionUid) return needLogin();
      const u = await db.collection("users").doc(sessionUid).get();
      if (!u.exists) return { error: "Profile not found" };
      return { id: sessionUid, ...u.data() };
    }
    case "update_my_profile": {
      if (!sessionUid) return needLogin();
      if (userRole && userRole !== "patient" && userRole !== "admin") {
        return { error: "Only patients can update this profile from Prakriti." };
      }
      const allowed = [
        "name",
        "phoneNumber",
        "age",
        "gender",
        "bloodGroup",
        "height",
        "weight",
        "allergies",
        "medicalConditions",
        "address",
        "emergencyContact",
        "profilePhoto",
      ];
      const updates: Record<string, unknown> = {};
      for (const k of allowed) {
        if (args[k] !== undefined && args[k] !== null) updates[k] = args[k];
      }
      if (Object.keys(updates).length === 0) return { error: "No valid fields" };
      updates.updatedAt = FieldValue.serverTimestamp();
      await db.collection("users").doc(sessionUid).update(updates);
      return { success: true, updated: Object.keys(updates).filter((k) => k !== "updatedAt") };
    }
    case "search_doctors": {
      const limit = Math.min(Number(args.limit) || 12, 50);
      const spec = args.specialization ? String(args.specialization) : "";
      const nameQ = args.nameQuery ? norm(String(args.nameQuery)) : "";
      const snap = await db.collection("doctors").limit(250).get();
      let list = snap.docs.map((x) => ({ id: x.id, ...x.data() })) as Record<string, unknown>[];
      if (spec) {
        const sn = spec.toLowerCase();
        list = list.filter((d) => String(d.specialization || "").toLowerCase().includes(sn));
      }
      if (nameQ) {
        list = list.filter((d) => norm(String(d.name || "")).includes(nameQ));
      }
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      return { doctors: list.slice(0, limit) };
    }
    case "get_doctor": {
      const doctorId = String(args.doctorId || "");
      if (!doctorId) return { error: "doctorId required" };
      const docSnap = await db.collection("doctors").doc(doctorId).get();
      if (!docSnap.exists) return { error: "Doctor not found" };
      return { id: docSnap.id, ...docSnap.data() };
    }
    case "suggest_doctors_for_concern": {
      const concern = String(args.concern || "");
      const limit = Math.min(Number(args.limit) || 6, 20);
      const qn = norm(concern);
      const snap = await db.collection("doctors").limit(300).get();
      const scored = snap.docs
        .map((doc) => {
          const d = doc.data() as Record<string, unknown>;
          const treats = (d.treats as string[]) || [];
          let score = 0;
          const hay = norm([d.name, d.specialization, d.bio, treats.join(" ")].join(" "));
          for (const token of qn.split(" ").filter((t) => t.length > 2)) {
            if (hay.includes(token)) score += 4;
          }
          if (d.specialization && qn.includes(norm(String(d.specialization)).split(" ")[0])) score += 10;
          for (const t of treats) {
            if (qn.includes(norm(t))) score += 12;
          }
          score += Math.min(Number(d.rating || 0) * 2, 10);
          return { id: doc.id, ...d, _score: score };
        })
        .sort((a, b) => Number(b._score) - Number(a._score))
        .slice(0, limit);
      return { suggestions: scored };
    }
    case "list_my_appointments": {
      if (!sessionUid) return needLogin();
      const limit = Math.min(Number(args.limit) || 30, 80);
      const status = args.status ? String(args.status) : "";
      let snap;
      if (userRole === "doctor") {
        const ds = await db.collection("doctors").where("userId", "==", sessionUid).limit(1).get();
        if (ds.empty) return { appointments: [] };
        const clinicalId = ds.docs[0].id;
        snap = await db.collection("appointments").where("doctorId", "==", clinicalId).get();
      } else {
        snap = await db.collection("appointments").where("patientId", "==", sessionUid).get();
      }
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as { id: string; date?: string; status?: string }[];
      if (status) list = list.filter((a) => a.status === status);
      list.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      return { appointments: list.slice(0, limit) };
    }
    case "book_appointment": {
      if (!sessionUid) return needLogin();
      if (userRole && userRole !== "patient" && userRole !== "admin") return needPatient();
      const doctorId = String(args.doctorId || "");
      const date = String(args.date || "");
      const time = String(args.time || "");
      const visitType = String(args.visitType || "in-person") as "video" | "home" | "in-person";
      const reason = String(args.reason || "");
      const feeArg = args.fee !== undefined ? Number(args.fee) : undefined;
      const dSnap = await db.collection("doctors").doc(doctorId).get();
      if (!dSnap.exists) return { error: "Doctor not found" };
      const d = dSnap.data()!;
      const uSnap = await db.collection("users").doc(sessionUid).get();
      const patientName = String(uSnap.data()?.name || "Patient");
      const fee = feeArg ?? (Number(d.consultationFee) || 0);
      const ref = await db.collection("appointments").add({
        patientId: sessionUid,
        patientName,
        doctorId,
        doctorName: d.name,
        doctorSpecialization: d.specialization,
        doctorPhoto: d.profilePhoto || "",
        date,
        time,
        visitType,
        reason,
        status: "pending",
        fee,
        paymentStatus: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });
      await createUserNotification(
        db,
        sessionUid,
        "Appointment reserved",
        `${d.name} on ${date} at ${time}. Pay the fee in Prakriti or Appointments to confirm your booking.`,
        "appointment",
      );
      return {
        success: true,
        appointmentId: ref.id,
        doctorName: d.name,
        fee,
        date,
        time,
        visitType,
        paymentStatus: "pending",
        summary: `Booked with ${d.name} on ${date} at ${time}. Payment is required to confirm.`,
      };
    }
    case "pay_appointment_fee": {
      if (!sessionUid) return needLogin();
      if (userRole && userRole !== "patient" && userRole !== "admin") return needPatient();
      const appointmentId = String(args.appointmentId || "");
      const result = await confirmAppointmentPayment(db, appointmentId, sessionUid);
      if (!result.ok) return { error: result.error };
      return {
        success: true,
        appointmentId: result.id,
        message: "Payment confirmed. Your appointment is booked.",
      };
    }
    case "cancel_appointment": {
      if (!sessionUid) return needLogin();
      const appointmentId = String(args.appointmentId || "");
      const ref = db.collection("appointments").doc(appointmentId);
      const docSnap = await ref.get();
      if (!docSnap.exists) return { error: "Appointment not found" };
      const data = docSnap.data()!;
      if (data.patientId !== sessionUid && userRole !== "admin") {
        return { error: "You can only cancel your own appointments." };
      }
      await ref.update({
        status: "cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        cancellationReason: "Cancelled via Prakriti",
      });
      await createUserNotification(
        db,
        sessionUid,
        "Appointment cancelled",
        `Your booking with ${String(data.doctorName || "the doctor")} was cancelled.`,
        "cancellation",
      );
      return { success: true, message: "Appointment cancelled." };
    }
    case "reschedule_appointment": {
      if (!sessionUid) return needLogin();
      const appointmentId = String(args.appointmentId || "");
      const newDate = String(args.newDate || "");
      const newTime = String(args.newTime || "");
      const ref = db.collection("appointments").doc(appointmentId);
      const docSnap = await ref.get();
      if (!docSnap.exists) return { error: "Appointment not found" };
      const data = docSnap.data()!;
      if (data.patientId !== sessionUid && userRole !== "admin") {
        return { error: "You can only reschedule your own appointments." };
      }
      await ref.update({
        date: newDate,
        time: newTime,
        status: "pending",
        rescheduledAt: FieldValue.serverTimestamp(),
        previousDate: data.date,
        previousTime: data.time,
      });
      await createUserNotification(
        db,
        sessionUid,
        "Appointment rescheduled",
        `New time: ${newDate} at ${newTime}. Complete payment if required to confirm.`,
        "appointment",
      );
      return { success: true, message: `Rescheduled to ${newDate} ${newTime}.` };
    }
    case "list_my_medical_records": {
      if (!sessionUid) return needLogin();
      const limit = Math.min(Number(args.limit) || 25, 60);
      try {
        const snap = await db
          .collection("medical_records")
          .where("userId", "==", sessionUid)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();
        return { records: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
      } catch {
        const snap = await db.collection("medical_records").where("userId", "==", sessionUid).get();
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return { records: list.slice(0, limit) };
      }
    }
    case "create_medical_record": {
      if (!sessionUid) return needLogin();
      if (userRole && userRole !== "patient" && userRole !== "admin") return needPatient();
      const title = String(args.title || "");
      const type = String(args.type || "note");
      const description = String(args.description || "");
      const date = String(args.date || new Date().toISOString().split("T")[0]);
      const uSnap = await db.collection("users").doc(sessionUid).get();
      const patientName = String(uSnap.data()?.name || "Patient");
      const ref = await db.collection("medical_records").add({
        userId: sessionUid,
        patientName,
        title,
        type,
        description,
        date,
        createdAt: FieldValue.serverTimestamp(),
        source: "prakriti_agent",
      });
      return { success: true, recordId: ref.id };
    }
    case "get_system_stats": {
      try {
        const [users, doctors, appointments, reviews, payments] = await Promise.all([
          db.collection("users").count().get(),
          db.collection("doctors").count().get(),
          db.collection("appointments").count().get(),
          db.collection("reviews").count().get(),
          db.collection("payments").count().get(),
        ]);
        return {
          totalUsers: users.data().count,
          totalDoctors: doctors.data().count,
          totalAppointments: appointments.data().count,
          totalReviews: reviews.data().count,
          totalPayments: payments.data().count,
        };
      } catch (e: unknown) {
        return { error: String(e) };
      }
    }
    case "get_map_route": {
      const dest = String(args.destinationName || "");
      const addr = String(args.address || "");
      const query = encodeURIComponent(`${dest}${addr ? ", " + addr : ""}`);
      return {
        success: true,
        destination: dest,
        searchUrl: `https://www.openstreetmap.org/search?query=${query}`,
        directionsUrl: `https://www.openstreetmap.org/directions?engine=osrm_car&route=%3B${query}`,
        note: "Patients can click these links to see the location and get the best route via OpenStreetMap.",
      };
    }
    default:
      return { error: `Unknown tool ${name}` };
  }
}

export async function runPrakritiAgent(
  genAI: GoogleGenerativeAI,
  db: Firestore,
  messages: ChatTurn[],
  sessionUid: string | undefined,
  language?: string,
): Promise<PrakritiAgentReply> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.text) throw new Error("No user message");

  let userRole: string | undefined;
  if (sessionUid) {
    const ur = await db.collection("users").doc(sessionUid).get();
    userRole = ur.data()?.role as string | undefined;
  }

  let sessionBlock = "";
  if (sessionUid) {
    sessionBlock = await buildUserContext(db, sessionUid);
    sessionBlock += `\nAUTHENTICATED_SESSION_UID: ${sessionUid}\nSESSION_ROLE: ${userRole || "unknown"}\n`;
  } else {
    sessionBlock = "User is NOT logged in. Tools that require login will return errors.";
  }

  let systemInstruction = `${AGENT_SYSTEM}\n\n${sessionBlock}`;

  if (language) {
    const langMap: Record<string, string> = {
      "hi-IN": "Hindi",
      "mr-IN": "Marathi",
      "ta-IN": "Tamil",
      "en-IN": "English",
    };
    const langName = langMap[language] || language;
    systemInstruction += `\nIMPORTANT: The user prefers ${langName}. You MUST respond to the user in ${langName} while keeping the medical advice accurate and tool outputs clear. If tool results are in English, translate the summary for the user into ${langName}.`;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    tools: [{ functionDeclarations: toolDeclarations() }],
    toolConfig: {
      functionCallingConfig: { mode: FunctionCallingMode.AUTO },
    },
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.text }],
  }));

  const chat = model.startChat({ history: history.length ? history : [] });

  let result = await chat.sendMessage(lastUser.text);
  const paymentPrompts: PrakritiPaymentPrompt[] = [];
  const uiCards: PrakritiUiCard[] = [];
  const paidThisTurn = new Set<string>();

  for (let step = 0; step < 24; step++) {
    const calls = result.response.functionCalls();
    if (!calls?.length) {
      const text = result.response.text();
      const prompts = paymentPrompts.filter((p) => !paidThisTurn.has(p.appointmentId));
      const cards = uiCards;
      if (!text?.trim()) {
        return {
          text: "I could not produce a reply. Please try again or rephrase your question.",
          paymentPrompts: prompts.length ? prompts : undefined,
          uiCards: cards.length ? cards : undefined,
        };
      }
      return {
        text,
        paymentPrompts: prompts.length ? prompts : undefined,
        uiCards: cards.length ? cards : undefined,
      };
    }

    const responses = await Promise.all(
      calls.map(async (call) => {
        const out = await executePrakritiTool(
          db,
          call.name,
          (call.args || {}) as Record<string, unknown>,
          sessionUid,
          userRole,
        );
        mergePaymentPrompts(paymentPrompts, paymentPromptsFromToolResult(call.name, out as Record<string, unknown>));
        mergeUiCards(uiCards, uiCardsFromToolResult(call.name, out as Record<string, unknown>));
        if (call.name === "pay_appointment_fee" && (out as { success?: boolean }).success && (out as { appointmentId?: string }).appointmentId) {
          paidThisTurn.add(String((out as { appointmentId: string }).appointmentId));
        }
        return {
          functionResponse: {
            name: call.name,
            response: out as Record<string, unknown>,
          },
        };
      }),
    );

    result = await chat.sendMessage(responses);
  }

  const prompts = paymentPrompts.filter((p) => !paidThisTurn.has(p.appointmentId));
  return {
    text: "Too many tool steps. Please narrow your request.",
    paymentPrompts: prompts.length ? prompts : undefined,
    uiCards: uiCards.length ? uiCards : undefined,
  };
}
