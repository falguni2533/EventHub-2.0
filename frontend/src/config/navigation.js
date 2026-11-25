import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Ticket,
  Users,
  ScanLine,
  UserCircle,
  ShieldCheck,
} from 'lucide-react';

export const STUDENT_NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'Overview of campus events, system status, and quick links.',
  },
  {
    id: 'events',
    label: 'Events',
    path: '/events',
    icon: CalendarDays,
    description: 'Browse upcoming college fests, hackathons, and workshops.',
  },
  {
    id: 'registrations',
    label: 'Registrations',
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
    id: 'team',
    label: 'My Team',
    path: '/team',
    icon: Users,
    description: 'Manage team members and invitations for group competitions.',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    path: '/attendance',
    icon: ScanLine,
    description: 'View verified check-ins and session attendance logs.',
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
    label: 'Admin Dashboard',
    path: '/admin',
    icon: ShieldCheck,
    description: 'Administrative overview, RBAC verification, and campus readiness.',
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
