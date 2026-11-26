import { Navigate, Route, Routes } from 'react-router-dom';
import {
  CalendarCog,
  ClipboardList,
  GraduationCap,
  ScanLine,
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
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminModulePlaceholderPage from './pages/admin/AdminModulePlaceholderPage';
import FeedbackAnalyzerPage from './pages/admin/FeedbackAnalyzerPage';
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
          <Route
            path="attendance"
            element={
              <AdminModulePlaceholderPage
                badge="Admin Panel • Attendance"
                title="Attendance Control"
                description="Scan QR passes and manage real-time check-ins at event venues."
                icon={ScanLine}
                cardTitle="QR Check-in Scanner & Logs"
                cardDescription="Live attendance verification, check-in desks, and participation logs will be implemented in an upcoming phase."
                endpointHint="/api/admin/attendance"
              />
            }
          />
          <Route
            path="reports"
            element={<Navigate to="/admin/feedback-analyzer" replace />}
          />
          <Route path="feedback-analyzer" element={<FeedbackAnalyzerPage />} />
          <Route path="profile" element={<MyProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
