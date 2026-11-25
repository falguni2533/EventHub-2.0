import {
  Ban,
  CalendarX2,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

const STATUS_STYLE_MAP = {
  Valid: { className: 'is-ok', icon: QrCode },
  'Checked In': { className: 'is-info', icon: ShieldCheck },
  Attended: { className: 'is-ok', icon: CheckCircle2 },
  'Missed/Expired': { className: 'is-warn', icon: Clock },
  Cancelled: { className: 'is-err', icon: XCircle },
  'Event Cancelled': { className: 'is-err', icon: CalendarX2 },
};

export default function PassStatusBadge({ status }) {
  const config = STATUS_STYLE_MAP[status] || { className: '', icon: Ban };
  const Icon = config.icon;

  return (
    <span className={`pill-badge status-pill ${config.className}`}>
      <Icon size={13} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}
