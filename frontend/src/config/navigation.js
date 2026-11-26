import {
  Award,
  LayoutDashboard,
  Compass,
  ClipboardCheck,
  Ticket,
  ScanLine,
  ShieldCheck,
  Users,
  UserCircle,
  CalendarCog,
  ClipboardList,
  GraduationCap,
  MessageSquareText,
} from 'lucide-react';

export const STUDENT_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'Overview of upcoming events, registrations, passes, and recent activity.',
  },
  {
    id: 'events',
    label: 'Explore Events',
    path: '/events',
    icon: Compass,
    description: 'Discover upcoming college fests, hackathons, and technical workshops.',
  },
  {
    id: 'registrations',
    label: 'My Registrations',
    path: '/registrations',
    icon: ClipboardCheck,
    description: 'Track your event sign-ups and approval status.',
  },
  {
    id: 'passes',
    label: 'My Passes',
    path: '/passes',
    icon: Ticket,
    description: 'Access your digital QR entry passes for registered events.',
  },
  {
    id: 'certificates',
    label: 'My Certificates',
    path: '/certificates',
    icon: Award,
    description: 'View and download verified certificates from attended events.',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    path: '/attendance',
    icon: ScanLine,
    description: 'View verified check-ins and session attendance logs.',
  },
  {
    id: 'team',
    label: 'My Team',
    path: '/team',
    icon: Users,
    description: 'Manage team members and invitations for group competitions.',
  },
  {
    id: 'profile',
    label: 'My Profile',
    path: '/profile',
    icon: UserCircle,
    description: 'Student profile details, college ID, and account settings.',
  },
];

export const ADMIN_NAV_ITEMS = [
  {
    id: 'admin-dashboard',
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    description: 'Administrative overview, campus metrics, and recent platform activity.',
  },
  {
    id: 'admin-events',
    label: 'Manage Events',
    path: '/admin/events',
    icon: CalendarCog,
    description: 'Create, schedule, and publish college events and fests.',
  },
  {
    id: 'admin-registrations',
    label: 'Registrations',
    path: '/admin/registrations',
    icon: ClipboardList,
    description: 'Review student event registrations, approvals, and waitlists.',
  },
  {
    id: 'admin-students',
    label: 'Students',
    path: '/admin/students',
    icon: GraduationCap,
    description: 'Browse registered students and campus enrollment records.',
  },
  {
    id: 'admin-attendance',
    label: 'Attendance',
    path: '/admin/attendance',
    icon: ScanLine,
    description: 'Track and verify event check-in attendance logs.',
  },
  {
    id: 'admin-verify',
    label: 'Verify QR / ID',
    path: '/admin/verify',
    icon: ShieldCheck,
    description: 'Verify student event passes for check-in or inspect certificate validity.',
  },
  {
    id: 'admin-certificates',
    label: 'Manage Certificates',
    path: '/admin/certificates',
    icon: Award,
    description: 'Issue, preview, and revoke participant certificates.',
  },
  {
    id: 'admin-feedback-analyzer',
    label: 'Reports & Analysis',
    path: '/admin/feedback-analyzer',
    icon: MessageSquareText,
    description: 'Analyze student event feedback, sentiment, and evaluation metrics.',
  },
  {
    id: 'admin-profile',
    label: 'My Profile',
    path: '/admin/profile',
    icon: UserCircle,
    description: 'Administrator account details and session information.',
  },
];

export const getNavItemsForRole = (role) =>
  role === 'admin' ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS;
