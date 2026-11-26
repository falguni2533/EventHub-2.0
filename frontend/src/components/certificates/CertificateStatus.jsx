import { AlertTriangle, CheckCircle2, Clock, UserCheck, UserX } from 'lucide-react';

export default function CertificateStatus({ status, type = 'certificate' }) {
  if (type === 'attendance') {
    if (status === 'present') {
      return (
        <span className="pill-badge status-pill is-ok">
          <UserCheck size={13} aria-hidden="true" />
          <span>Present</span>
        </span>
      );
    }
    return (
      <span className="pill-badge status-pill is-err">
        <UserX size={13} aria-hidden="true" />
        <span>Absent</span>
      </span>
    );
  }

  switch (status) {
    case 'valid':
      return (
        <span className="pill-badge status-pill is-ok">
          <CheckCircle2 size={13} aria-hidden="true" />
          <span>Verified & Valid</span>
        </span>
      );
    case 'revoked':
      return (
        <span className="pill-badge status-pill is-err">
          <AlertTriangle size={13} aria-hidden="true" />
          <span>Revoked</span>
        </span>
      );
    case 'not_generated':
    default:
      return (
        <span className="pill-badge status-pill">
          <Clock size={13} aria-hidden="true" />
          <span>Not Generated</span>
        </span>
      );
  }
}
