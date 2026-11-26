import { useState } from 'react';
import { CalendarDays, Download, Eye, MapPin, QrCode, Ticket } from 'lucide-react';
import PassStatusBadge from './PassStatusBadge';
import { triggerPassDownload } from '../../services/passService';
import { formatEventDate, formatEventTime } from '../../utils/dateFormat';

export default function PassCard({ pass, onViewPass }) {
  const [downloading, setDownloading] = useState(false);

  const isDownloadable = Boolean(pass.qrCode && pass.registrationStatus === 'confirmed');

  const handleDownload = async () => {
    if (!isDownloadable) return;
    try {
      setDownloading(true);
      await triggerPassDownload(pass.registrationId, pass.registrationCode);
    } catch (err) {
      console.error('Pass download failed:', err);
      alert(err.message || 'Failed to download digital pass.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="card pass-card">
      <div className="pass-card-top">
        <span className="event-category-pill">{pass.event?.category || 'Event'}</span>
        <PassStatusBadge status={pass.displayStatus} />
      </div>

      <h3 className="pass-card-title">{pass.event?.title || 'Campus Event'}</h3>

      <div className="pass-card-meta">
        <div className="pass-meta-row">
          <CalendarDays size={14} aria-hidden="true" />
          <span>
            {formatEventDate(pass.event?.date)}
            {pass.event?.date ? ` • ${formatEventTime(pass.event.date)}` : ''}
          </span>
        </div>
        <div className="pass-meta-row">
          <MapPin size={14} aria-hidden="true" />
          <span>{pass.event?.venue || 'Campus Venue'}</span>
        </div>
        <div className="pass-meta-row">
          <Ticket size={14} aria-hidden="true" />
          <span>
            Registration ID: <code className="cert-id-code">{pass.registrationCode}</code>
          </span>
        </div>
      </div>

      {pass.qrCode ? (
        <div className="pass-qr-mini-wrap">
          <img
            src={pass.qrCode}
            alt={`QR Pass for ${pass.event?.title}`}
            className={`pass-qr-mini ${
              pass.displayStatus === 'Cancelled' ||
              pass.displayStatus === 'Event Cancelled' ||
              pass.displayStatus === 'Missed/Expired'
                ? 'is-inactive'
                : ''
            }`}
          />
          <div className="pass-qr-mini-copy">
            <strong>Digital Entry QR</strong>
            <span>
              {pass.displayStatus === 'Valid'
                ? 'Ready for venue check-in'
                : pass.displayStatus === 'Checked In'
                ? 'Checked in at venue'
                : `Historical record (${pass.displayStatus})`}
            </span>
          </div>
        </div>
      ) : (
        <div className="pass-qr-mini-wrap is-disabled">
          <QrCode size={22} aria-hidden="true" />
          <div className="pass-qr-mini-copy">
            <strong>QR Unavailable</strong>
            <span>Status: {pass.displayStatus}</span>
          </div>
        </div>
      )}

      <div className="pass-card-actions">
        <button
          type="button"
          className="btn-primary cert-action-grow"
          onClick={() => onViewPass(pass)}
        >
          <Eye size={14} aria-hidden="true" />
          <span>View Pass</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={handleDownload}
          disabled={!isDownloadable || downloading}
          title={
            isDownloadable
              ? 'Download PDF Event Pass'
              : 'PDF download available only for confirmed registrations'
          }
        >
          <Download size={14} aria-hidden="true" />
          <span>{downloading ? 'Saving...' : 'Download'}</span>
        </button>
      </div>
    </article>
  );
}
