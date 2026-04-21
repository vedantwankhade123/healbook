export type UserRole = "patient" | "doctor" | "admin";

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  profilePhoto?: string;
  createdAt: any; // Firestore Timestamp
  phoneNumber?: string;
}

export interface Doctor {
  id: string; // The Firestore doc ID
  userId: string; // Linked to Firebase Auth user UID
  name: string;
  email: string;
  profilePhoto: string;
  specialization: string;
  experience: number;
  clinicName: string;
  facilityId?: string; // Linked to facilities collection
  facilityIds?: string[]; // Multiple facilities support
  consultationFee: number;
  bio: string;
  education: string;
  languages: string[];
  rating: number;
  isAvailable: boolean;
  availabilityStatus?: "available_today" | "available_tomorrow" | "weekend";
  gender?: "male" | "female" | "other";
  treats: string[]; // Array of symptoms
  createdAt: any;
  reviewsCount?: number;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorPhoto: string;
  date: string; // ISO string or specific format
  time: string;
  visitType: "video" | "home" | "in-person";
  reason: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "expired";
  fee: number;
  paymentId?: string;
  paymentStatus: "pending" | "paid";
  paidAt?: unknown;
  createdAt: any;
}

export interface MedicalRecord {
  id: string;
  userId: string;
  title: string;
  type: "report" | "prescription" | "lab_result" | "other";
  fileUrl: string;
  fileName: string;
  doctorName?: string;
  date: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "appointment" | "payment" | "system" | "cancellation";
  read: boolean;
  createdAt: any;
}

export interface Facility {
  id: string;
  name: string;
  type: "hospital" | "clinic";
  address: string;
  city: string;
  rating: number;
  image: string;
  description: string;
  specializations: string[];
  contact?: string;
  createdAt?: any;
}
