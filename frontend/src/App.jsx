import { Route, Routes } from 'react-router-dom';
import {
  BarChart3,
  CalendarCog,
  ClipboardList,
  GraduationCap,
} from 'lucide-react';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicOnlyRoute from './components/auth/PublicOnlyRoute';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import RegistrationsPage from './pages/RegistrationsPage';
import MyPassesPage from './pages/MyPassesPage';
import MyTeamPage from './pages/MyTeamPage';
import AttendancePage from './pages/AttendancePage';
import MyProfilePage from './pages/MyProfilePage';
import MyCertificatesPage from './pages/certificates/MyCertificatesPage';
import VerifyCertificatePage from './pages/certificates/VerifyCertificatePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminModulePlaceholderPage from './pages/admin/AdminModulePlaceholderPage';
import ManageCertificatesPage from './pages/admin/ManageCertificatesPage';
import AttendanceVerifyPage from './pages/admin/AttendanceVerifyPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Public Certificate Verification Portal */}
      <Route path="/verify" element={<VerifyCertificatePage />} />
      <Route path="/verify/:certificateId" element={<VerifyCertificatePage />} />

      {/* Role Mismatch Notice */}
      <Route element={<ProtectedRoute />}>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Protected Student Panel Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="registrations" element={<RegistrationsPage />} />
          <Route path="passes" element={<MyPassesPage />} />
          <Route path="certificates" element={<MyCertificatesPage />} />
          <Route path="team" element={<MyTeamPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="profile" element={<MyProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      {/* Protected Admin Panel Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route
            path="events"
            element={
              <AdminModulePlaceholderPage
                badge="Admin Panel • Manage Events"
                title="Event Management"
                description="Create, schedule, edit, and publish campus events and fests."
                icon={CalendarCog}
                cardTitle="Campus Event Builder"
                cardDescription="Full event creation, capacity configuration, and publishing controls will be implemented in the upcoming Event Management phase."
                endpointHint="/api/admin/events"
              />
            }
          />
          <Route
            path="registrations"
            element={
              <AdminModulePlaceholderPage
                badge="Admin Panel • Registrations"
                title="Student Registrations"
                description="Inspect student sign-ups, confirm seats, and manage waitlists across events."
                icon={ClipboardList}
                cardTitle="Registration Management Desk"
                cardDescription="Filtering, approval workflows, and registration exports will be activated once event registrations launch."
                endpointHint="/api/admin/registrations"
              />
            }
          />
          <Route
            path="students"
            element={
              <AdminModulePlaceholderPage
                badge="Admin Panel • Students"
                title="Student Directory"
                description="View verified student accounts, college affiliations, and enrollment IDs."
                icon={GraduationCap}
                cardTitle="Student Roster & Verification"
                cardDescription="Searchable student rosters and participation summaries will be unlocked in an upcoming phase. Total student counts are already live on your Admin Dashboard."
                endpointHint="/api/admin/students"
              />
            }
          />
          <Route path="attendance" element={<AttendanceVerifyPage />} />
          <Route path="verify" element={<AttendanceVerifyPage />} />
          <Route path="certificates" element={<ManageCertificatesPage />} />
          <Route
            path="reports"
            element={
              <AdminModulePlaceholderPage
                badge="Admin Panel • Reports & Analytics"
                title="Reports & Analytics"
                description="Monitor event turnout, category performance, and campus engagement."
                icon={BarChart3}
                cardTitle="Platform Analytics Suite"
                cardDescription="Interactive turnout reports, CSV exports, and attendance breakdowns will become available once event activity accumulates."
                endpointHint="/api/admin/reports"
              />
            }
          />
          <Route path="profile" element={<MyProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
