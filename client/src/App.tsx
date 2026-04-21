import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { DoctorLayout } from "./layouts/DoctorLayout";
import { AdminLayout } from "./layouts/AdminLayout";

import HomePage from "./pages/page";
import LoginPage from "./pages/(auth)/login/page";
import RegisterPage from "./pages/(auth)/register/page";

import DashboardPage from "./pages/(main)/dashboard/page";
import DoctorsPage from "./pages/(main)/doctors/page";
import DoctorDetailPage from "./pages/(main)/doctors/[id]/page";
import AppointmentsPage from "./pages/(main)/appointments/page";
import BookAppointmentPage from "./pages/(main)/appointments/book/[doctorId]/page";
import RecordsPage from "./pages/(main)/records/page";
import ProfilePage from "./pages/(main)/profile/page";
import HealthAiPage from "./pages/(main)/health-ai/page";
import FacilityListingPage from "./pages/(main)/hospitals/page";
import FacilityDetailPage from "./pages/(main)/hospitals/[id]/page";

import DoctorDashboardPage from "./pages/(doctor)/doctor-dashboard/page";
import DoctorPatientsPage from "./pages/(doctor)/doctor-dashboard/patients/page";
import DoctorSchedulePage from "./pages/(doctor)/doctor-dashboard/schedule/page";
import DoctorRecordsPage from "./pages/(doctor)/doctor-dashboard/records/page";
import DoctorProfilePage from "./pages/(doctor)/doctor-dashboard/profile/page";

import AdminHomePage from "./pages/(admin)/admin/page";
import AdminDoctorsPage from "./pages/(admin)/admin/doctors/page";
import AdminPatientsPage from "./pages/(admin)/admin/patients/page";
import AdminLogsPage from "./pages/(admin)/admin/logs/page";
import AdminSettingsPage from "./pages/(admin)/admin/settings/page";
import AdminProfilePage from "./pages/(admin)/admin/profile/page";
import AdminAuditPage from "./pages/(admin)/admin/audit/page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:id" element={<DoctorDetailPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/book/:doctorId" element={<BookAppointmentPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/health-ai" element={<HealthAiPage />} />
        <Route path="/hospitals" element={<FacilityListingPage />} />
        <Route path="/hospitals/:id" element={<FacilityDetailPage />} />
      </Route>

      <Route element={<DoctorLayout />}>
        <Route path="/doctor-dashboard" element={<DoctorDashboardPage />} />
        <Route path="/doctor-dashboard/patients" element={<DoctorPatientsPage />} />
        <Route path="/doctor-dashboard/schedule" element={<DoctorSchedulePage />} />
        <Route path="/doctor-dashboard/records" element={<DoctorRecordsPage />} />
        <Route path="/doctor-dashboard/profile" element={<DoctorProfilePage />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<AdminHomePage />} />
        <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
        <Route path="/admin/patients" element={<AdminPatientsPage />} />
        <Route path="/admin/logs" element={<AdminLogsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
