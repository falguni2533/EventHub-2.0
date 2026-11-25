import { ScanLine } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import ComingSoonCard from '../components/common/ComingSoonCard';

export default function AttendancePage() {
  return (
    <>
      <PageHeader
        badge="Student Panel • Attendance"
        title="Attendance History"
        description="Track verified check-ins across workshops, seminars, and multi-day college events."
      />
      <ComingSoonCard
        icon={ScanLine}
        title="Verified Check-in Records"
        description="View timestamped attendance logs and eligibility status for participation certificates."
        targetPhase="Upcoming Feature Phase"
        endpointHint="GET /api/attendance/my"
      />
    </>
  );
}
