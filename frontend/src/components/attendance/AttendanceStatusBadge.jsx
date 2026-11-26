import { CheckCircle2, XCircle } from 'lucide-react';

export default function AttendanceStatusBadge({ status }) {
  const isPresent = String(status).toLowerCase() === 'present';
  return (
    <span className={`att-status-badge ${isPresent ? 'is-present' : 'is-absent'}`}>
      {isPresent ? (
        <CheckCircle2 size={13} aria-hidden="true" />
      ) : (
        <XCircle size={13} aria-hidden="true" />
      )}
      <span>{isPresent ? 'Present' : 'Absent'}</span>
    </span>
  );
}
