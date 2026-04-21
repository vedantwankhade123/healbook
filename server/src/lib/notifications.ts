import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";

export type NotificationType = "appointment" | "payment" | "system" | "cancellation";

export async function createUserNotification(
  db: Firestore,
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
): Promise<string> {
  const ref = await db.collection("notifications").add({
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
