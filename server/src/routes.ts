import { Router, type Response, type NextFunction } from "express";
import type { Query } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { adminAuth, adminDb, getAdminAuth, getAdminDb } from "./firebase-admin.js";
import type { AuthedRequest } from "./middleware/auth.js";
import { requireAuth, optionalAuth } from "./middleware/auth.js";
import { buildUserContext } from "./lib/prakriti.js";
import { runPrakritiAgent } from "./prakritiAgent.js";
import { generateExtendedDataset } from "./data/doctors-seed.js";
import { confirmAppointmentPayment } from "./lib/confirmAppointmentPayment.js";
import { createUserNotification } from "./lib/notifications.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function getUserRole(uid: string): Promise<string | undefined> {
  const doc = await adminDb.collection("users").doc(uid).get();
  return doc.data()?.role as string | undefined;
}

async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.uid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const role = await getUserRole(req.uid);
  if (role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export function createApiRouter(): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    const auth = getAdminAuth();
    const db = getAdminDb();
    res.json({
      ok: !!(auth && db),
      firebase: {
        projectId: !!process.env.FIREBASE_PROJECT_ID,
        clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLen: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      },
      env: process.env.NODE_ENV,
      netlify: !!process.env.NETLIFY,
    });
  });

  router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const decoded = req.decodedToken;
    const fallbackProfile = {
      uid,
      name: decoded?.name || "User",
      email: decoded?.email || "",
      role: "patient",
      hasPassword: !!decoded?.email,
      profileIncomplete: true,
    };

    try {
      const ref = adminDb.collection("users").doc(uid);
      const doc = await ref.get();
      if (!doc.exists) {
        await ref.set(
          {
            name: fallbackProfile.name,
            email: fallbackProfile.email,
            role: "patient",
            hasPassword: fallbackProfile.hasPassword,
            createdAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        const created = await ref.get();
        return res.json({ uid, ...created.data() });
      }
      return res.json({ uid, ...doc.data() });
    } catch (err) {
      console.error("GET /api/me fallback due to Firestore error:", err);
      return res.json(fallbackProfile);
    }
  });

  router.post("/users/profile", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const ref = adminDb.collection("users").doc(uid);
    const existing = await ref.get();
    if (existing.exists) {
      return res.status(409).json({ error: "Profile already exists" });
    }
    const body = req.body as Record<string, unknown>;
    await ref.set({
      name: body.name,
      email: body.email,
      role: body.role || "patient",
      phoneNumber: body.phoneNumber,
      profilePhoto: body.profilePhoto,
      hasPassword: body.hasPassword ?? false,
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    res.status(201).json({ uid, ...doc.data() });
  });

  router.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
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
      "hasPassword",
    ] as const;
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields" });
    }
    updates.updatedAt = FieldValue.serverTimestamp();
    await adminDb.collection("users").doc(req.uid!).update(updates);
    const doc = await adminDb.collection("users").doc(req.uid!).get();
    res.json({ uid: req.uid, ...doc.data() });
  });

  router.get("/patient/stats", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const [apptCount, recCount] = await Promise.all([
      adminDb.collection("appointments").where("patientId", "==", uid).count().get(),
      adminDb.collection("medical_records").where("userId", "==", uid).count().get(),
    ]);
    res.json({
      appointments: apptCount.data().count,
      files: recCount.data().count,
    });
  });

  router.get("/doctors", async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const orderField = (req.query.orderBy as string) || "rating";
      const dir = (req.query.orderDir as "asc" | "desc") || "desc";
      const snap = await adminDb.collection("doctors").orderBy(orderField, dir).limit(limit).get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e: unknown) {
      const snap = await adminDb.collection("doctors").get();
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ra = Number((a as { rating?: number }).rating ?? 0);
        const rb = Number((b as { rating?: number }).rating ?? 0);
        return rb - ra;
      });
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      res.json(list.slice(0, limit));
    }
  });

  router.get("/doctors/mine", requireAuth, async (req: AuthedRequest, res) => {
    const snap = await adminDb.collection("doctors").where("userId", "==", req.uid!).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: "No doctor profile" });
    const d = snap.docs[0];
    res.json({ id: d.id, ...d.data() });
  });

  router.get("/doctors/:id", async (req, res) => {
    const doc = await adminDb.collection("doctors").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  });

  router.get("/facilities", async (req, res) => {
    const snap = await adminDb.collection("facilities").get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });

  router.get("/facilities/:id", async (req, res) => {
    const doc = await adminDb.collection("facilities").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json({ id: doc.id, ...doc.data() });
  });

  router.get("/facilities/:id/doctors", async (req, res) => {
    const snap = await adminDb.collection("doctors").where("facilityId", "==", req.params.id).get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });

  router.post("/doctors", requireAuth, requireAdmin, async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const ref = await adminDb.collection("doctors").add({
      ...body,
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  });

  router.delete("/doctors/:id", requireAuth, requireAdmin, async (req, res) => {
    await adminDb.collection("doctors").doc(req.params.id).delete();
    res.json({ ok: true });
  });

  router.get("/appointments", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const role = await getUserRole(uid);
    const { patientId, doctorId, status } = req.query;

    let q: Query = adminDb.collection("appointments");

    if (patientId) {
      if (patientId !== uid && role !== "admin" && role !== "doctor") {
        return res.status(403).json({ error: "Forbidden" });
      }
      q = q.where("patientId", "==", patientId);
    } else if (doctorId) {
      const ddoc = await adminDb.collection("doctors").doc(doctorId as string).get();
      if (!ddoc.exists) return res.status(404).json({ error: "Doctor not found" });
      if (ddoc.data()?.userId !== uid && role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      q = q.where("doctorId", "==", doctorId);
    } else {
      return res.status(400).json({ error: "Specify patientId or doctorId" });
    }

    if (status) q = q.where("status", "==", status);

    const snap = await q.get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string;
      date?: string;
      time?: string;
      createdAt?: unknown;
    }[];
    list.sort((a, b) => {
      const dc = String(a.date || "").localeCompare(String(b.date || ""));
      if (dc !== 0) return dc;
      return String(a.time || "").localeCompare(String(b.time || ""));
    });
    res.json(list);
  });

  router.post("/appointments", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const body = req.body as Record<string, unknown>;
    if (body.patientId && body.patientId !== uid) {
      const role = await getUserRole(uid);
      if (role !== "admin" && role !== "doctor") {
        return res.status(403).json({ error: "Cannot book for another patient" });
      }
    }
    const patientId = (body.patientId as string) || uid;
    const ref = await adminDb.collection("appointments").add({
      ...body,
      patientId,
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();

    // Notify Doctor of new booking
    try {
      const doctorId = body.doctorId as string;
      if (doctorId) {
        const ddoc = await adminDb.collection("doctors").doc(doctorId).get();
        if (ddoc.exists) {
          const ddata = ddoc.data()!;
          if (ddata.userId) {
            await createUserNotification(
              adminDb,
              ddata.userId,
              "New Appointment Booking",
              `${String(body.patientName || "A patient")} has scheduled a visit for ${String(body.date)} at ${String(body.time)}.`,
              "appointment",
            );
          }
        }
      }
    } catch (e) {
      console.error("Error creating booking notification:", e);
    }

    res.status(201).json({ id: doc.id, ...doc.data() });
  });

  router.patch("/appointments/:id", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const role = await getUserRole(uid);
    const ref = adminDb.collection("appointments").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    const data = doc.data()!;
    if (data.patientId !== uid && role !== "admin" && role !== "doctor") {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (role === "doctor") {
      const dsnap = await adminDb.collection("doctors").where("userId", "==", uid).limit(1).get();
      const clinicalId = dsnap.empty ? null : dsnap.docs[0].id;
      if (clinicalId && data.doctorId !== clinicalId) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    const patch = req.body as Record<string, unknown>;
    const oldStatus = data.status;
    await ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
    
    // Notification Logic
    if (patch.status && patch.status !== oldStatus) {
      try {
        const patientUid = data.patientId;
        const ddoc = await adminDb.collection("doctors").doc(data.doctorId).get();
        const doctorUid = ddoc.exists ? ddoc.data()?.userId : null;

        if (patch.status === "completed") {
          // Notify Patient
          await createUserNotification(
            adminDb,
            patientUid,
            "Check-up Completed",
            `Your visit with Dr. ${String(data.doctorName || "the doctor")} is marked as complete. Hope you feel better!`,
            "appointment",
          );
          // Notify Doctor
          if (doctorUid) {
            await createUserNotification(
              adminDb,
              doctorUid,
              "Session Finished",
              `The clinical visit with ${String(data.patientName || "the patient")} has been recorded as complete.`,
              "appointment",
            );
          }
        } else if (patch.status === "cancelled") {
          const isByPatient = uid === patientUid;
          const isByDoctor = uid === doctorUid;

          if (isByPatient) {
            // Notify Doctor if patient cancels
            if (doctorUid) {
              await createUserNotification(
                adminDb,
                doctorUid,
                "Appointment Cancelled",
                `${String(data.patientName || "Your patient")} has cancelled their slot for ${String(data.date)}.`,
                "cancellation",
              );
            }
          } else if (isByDoctor || role === "admin" || role === "doctor") {
            // Notify Patient if doctor/admin cancels
            await createUserNotification(
              adminDb,
              patientUid,
              "Appointment Cancelled",
              `Your booking with Dr. ${String(data.doctorName || "the doctor")} on ${String(data.date)} was cancelled.`,
              "cancellation",
            );
          }
        }
      } catch (e) {
        console.error("Error creating status notification:", e);
      }
    }

    const next = await ref.get();
    res.json({ id: next.id, ...next.data() });
  });

  /** Patient pays consultation fee — confirms booking (no external payment gateway in this build). */
  router.post("/appointments/:id/pay", requireAuth, async (req: AuthedRequest, res) => {
    const result = await confirmAppointmentPayment(adminDb, req.params.id, req.uid!);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json(result.data);
  });

  router.get("/medical-records", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const target = (req.query.userId as string) || uid;
    const role = await getUserRole(uid);
    if (target !== uid && role !== "admin" && role !== "doctor") {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const snap = await adminDb
        .collection("medical_records")
        .where("userId", "==", target)
        .orderBy("createdAt", "desc")
        .get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      const snap = await adminDb.collection("medical_records").where("userId", "==", target).get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  });

  router.post("/medical-records", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const ref = await adminDb.collection("medical_records").add({
      ...(req.body as object),
      userId: uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  });

  router.patch("/medical-records/:id", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const ref = adminDb.collection("medical_records").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    if (doc.data()?.userId !== uid) return res.status(403).json({ error: "Forbidden" });
    await ref.update({ ...(req.body as object), updatedAt: FieldValue.serverTimestamp() });
    const next = await ref.get();
    res.json({ id: next.id, ...next.data() });
  });

  router.delete("/medical-records/:id", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const ref = adminDb.collection("medical_records").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    if (doc.data()?.userId !== uid) return res.status(403).json({ error: "Forbidden" });
    await ref.delete();
    res.json({ ok: true });
  });

  router.post("/medical-records/delete-many", requireAuth, async (req: AuthedRequest, res) => {
    const uid = req.uid!;
    const ids = (req.body as { ids?: string[] }).ids || [];
    for (const id of ids) {
      const ref = adminDb.collection("medical_records").doc(id);
      const doc = await ref.get();
      if (doc.exists && doc.data()?.userId === uid) await ref.delete();
    }
    res.json({ ok: true });
  });

  router.get("/notifications", requireAuth, async (req: AuthedRequest, res) => {
    try {
      const snap = await adminDb
        .collection("notifications")
        .where("userId", "==", req.uid!)
        .orderBy("createdAt", "desc")
        .get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      const snap = await adminDb.collection("notifications").where("userId", "==", req.uid!).get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  });

  router.patch("/notifications/:id", requireAuth, async (req: AuthedRequest, res) => {
    const ref = adminDb.collection("notifications").doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.userId !== req.uid) {
      return res.status(404).json({ error: "Not found" });
    }
    await ref.update(req.body as object);
    const next = await ref.get();
    res.json({ id: next.id, ...next.data() });
  });

  router.post("/notifications/mark-all-read", requireAuth, async (req: AuthedRequest, res) => {
    const snap = await adminDb.collection("notifications").where("userId", "==", req.uid!).get();
    const batch = adminDb.batch();
    snap.docs.forEach((d) => {
      if (!d.data()?.read) batch.update(d.ref, { read: true });
    });
    await batch.commit();
    res.json({ ok: true });
  });

  router.get("/users/by-ids", requireAuth, async (req: AuthedRequest, res) => {
    const ids = String(req.query.ids || "")
      .split(",")
      .filter(Boolean)
      .slice(0, 30);
    if (ids.length === 0) return res.json({});
    const out: Record<string, { profilePhoto?: string; name?: string }> = {};
    await Promise.all(
      ids.map(async (id) => {
        const doc = await adminDb.collection("users").doc(id).get();
        if (doc.exists) {
          const d = doc.data()!;
          out[id] = { profilePhoto: d.profilePhoto, name: d.name };
        }
      }),
    );
    res.json(out);
  });

  router.get("/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
    const [docsSnap, usersSnap, aptsSnap] = await Promise.all([
      adminDb.collection("doctors").get(),
      adminDb.collection("users").get(),
      adminDb.collection("appointments").get(),
    ]);
    const allDoctors = docsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const allPatients = usersSnap.docs.filter((d) => d.data().role === "patient").map((d) => ({ id: d.id, ...d.data() }));
    const allAppointments = aptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const activities = [
      ...allDoctors.slice(0, 5).map((d: Record<string, unknown>) => ({
        id: `doc-${d.id}`,
        type: "doctor" as const,
        title: "New Practitioner Registered",
        message: `Dr. ${d.name} joined the clinical network.`,
        timestamp: d.createdAt,
        icon: "person_add",
      })),
      ...allPatients.slice(0, 5).map((p: Record<string, unknown>) => ({
        id: `pat-${p.id}`,
        type: "patient" as const,
        title: "Patient Onboarding",
        message: `${p.name} registered on HealBook.`,
        timestamp: p.createdAt,
        icon: "person",
      })),
      ...allAppointments.slice(0, 5).map((a: Record<string, unknown>) => ({
        id: `apt-${a.id}`,
        type: "appointment" as const,
        title: "Appointment Scheduled",
        message: `Booking for ${a.patientName} with ${a.doctorName}.`,
        timestamp: a.createdAt,
        icon: "event",
      })),
    ];

    res.json({
      stats: {
        doctors: allDoctors.length,
        patients: allPatients.length,
        appointments: allAppointments.length,
      },
      activities,
    });
  });

  router.get("/admin/audit", requireAuth, requireAdmin, async (_req, res) => {
    const [docsSnap, usersSnap, aptsSnap] = await Promise.all([
      adminDb.collection("doctors").orderBy("createdAt", "desc").limit(20).get(),
      adminDb.collection("users").orderBy("createdAt", "desc").limit(20).get(),
      adminDb.collection("appointments").orderBy("createdAt", "desc").limit(10).get(),
    ]);
    const allDoctors = docsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const allPatients = usersSnap.docs.filter((d) => d.data().role === "patient").map((d) => ({ id: d.id, ...d.data() }));
    const allAppointments = aptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const activities = [
      ...allDoctors.map((d: Record<string, unknown>) => ({
        id: `doc-${d.id}`,
        type: "doctor" as const,
        title: "New Practitioner Registered",
        message: `Dr. ${d.name} joined the clinical network.`,
        timestamp: d.createdAt,
        icon: "person_add",
      })),
      ...allPatients.map((p: Record<string, unknown>) => ({
        id: `pat-${p.id}`,
        type: "patient" as const,
        title: "Patient Onboarding",
        message: `${p.name} registered on HealBook.`,
        timestamp: p.createdAt,
        icon: "person",
      })),
      ...allAppointments.map((a: Record<string, unknown>) => ({
        id: `apt-${a.id}`,
        type: "appointment" as const,
        title: "Appointment Scheduled",
        message: `Booking for ${a.patientName} with ${a.doctorName}.`,
        timestamp: a.createdAt,
        icon: "event",
      })),
    ];

    activities.sort((a, b) => {
      const ta = (a.timestamp as { toMillis?: () => number })?.toMillis?.() ?? 0;
      const tb = (b.timestamp as { toMillis?: () => number })?.toMillis?.() ?? 0;
      return tb - ta;
    });

    res.json({ activities });
  });

  router.get("/admin/patients", requireAuth, requireAdmin, async (_req, res) => {
    const snap = await adminDb.collection("users").where("role", "==", "patient").get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });

  router.get("/admin/logs", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const snap = await adminDb.collection("audit_logs").orderBy("timestamp", "desc").limit(100).get();
      res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      res.json([]);
    }
  });

  router.post("/seed/doctors", requireAuth, requireAdmin, async (_req, res) => {
    const { doctors, facilities } = generateExtendedDataset() as { doctors: any[], facilities: any[] };
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    let facilityCount = 0;

    // 1. Seed Facilities
    for (const f of facilities) {
        await adminDb.collection("facilities").doc(f.id).set({
            ...f,
            createdAt: FieldValue.serverTimestamp()
        });
        facilityCount++;
    }

    // 2. Seed Doctors
    for (const docData of doctors) {
      try {
        let authUser;
        try {
          authUser = await adminAuth.getUserByEmail(docData.email as string);
          // If user exists, we still update the doctor doc to ensure facility mapping is current
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

    res.json({
      message: "Seeding completed",
      results: { 
          facilities: facilityCount,
          success: successCount, 
          skipped: skipCount, 
          errors: errorCount 
      },
    });
  });

  router.post("/ai-chat", optionalAuth, async (req: AuthedRequest, res) => {
    try {
      const { message, history, userId } = req.body as {
        message?: string;
        history?: { role: string; parts: { text: string }[] }[];
        userId?: string;
      };
      if (!message) return res.status(400).json({ error: "Message is required" });

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      let personalizedPrompt = `You are HealBot, an advanced AI Health Assistant for HealBook. Never diagnose; suggest professional care for emergencies. Use markdown.`;

      if (userId) {
        const ctx = await buildUserContext(adminDb, userId);
        personalizedPrompt += "\n" + ctx;
      }

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: personalizedPrompt }] },
          { role: "model", parts: [{ text: "Understood. I am HealBot. How can I help?" }] },
          ...((history || []) as { role: string; parts: { text: string }[] }[]).map((h) => ({
            role: h.role === "model" ? "model" : "user",
            parts: h.parts,
          })),
        ],
      });

      const result = await chat.sendMessage(message);
      const text = result.response.text();
      res.json({ text });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed";
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: msg });
    }
  });

  router.post("/chat", optionalAuth, async (req: AuthedRequest, res) => {
    try {
      const body = req.body as {
        messages?: { role: "user" | "assistant"; text: string }[];
        userId?: string;
      };
      const messages = body.messages || [];
      const sessionUid = req.uid;

      if (!messages.length) {
        return res.status(400).json({ error: "No messages" });
      }

      const reply = await runPrakritiAgent(genAI, adminDb, messages, sessionUid);
      res.json(reply);
    } catch (error: unknown) {
      console.error("Prakriti agent error:", error);
      const msg = error instanceof Error ? error.message : "Chat failed";
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
