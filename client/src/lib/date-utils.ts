/**
 * Robustly parses a date value from various formats (Firestore Timestamp, 
 * serialized JSON, ISO string, etc.) into a JS Date object.
 */
export function safeParseDate(val: any): Date {
  if (val === null || val === undefined) return new Date();

  // If it's already a Date object
  if (val instanceof Date) return val;

  // If it's a Firestore Timestamp from the client SDK (has toDate method)
  if (typeof val.toDate === "function") return val.toDate();

  // If it's a serialized Timestamp from the Admin SDK (has _seconds)
  if (typeof val._seconds === "number") {
    return new Date(val._seconds * 1000 + Math.floor((val._nanoseconds || 0) / 1000000));
  }

  // If it's a serialized Timestamp from the Client SDK (has seconds)
  if (typeof val.seconds === "number") {
    return new Date(val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000));
  }

  // If it's a string or other number format, try to parse it
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;

  // Final fallback to now to prevent UI crashes
  return new Date();
}
