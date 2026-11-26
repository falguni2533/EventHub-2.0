import { useState } from 'react';
import { CalendarDays, Download, MapPin, ShieldCheck, Ticket, X } from 'lucide-react';
import PassStatusBadge from './PassStatusBadge';
import { triggerPassDownload } from '../../services/passService';
import { formatActivityDateTime, formatEventDate, formatEventTime } from '../../utils/dateFormat';

export default function PassPreviewModal({ pass, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!pass) return null;

  const isDownloadable = Boolean(pass.qrCode && pass.registrationStatus === 'confirmed');

  const handleDownload = async () => {
    if (!isDownloadable) return;
    try {
      setDownloading(true);
      await triggerPassDownload(pass.registrationId, pass.registrationCode);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to download digital pass PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="eh-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="eh-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="eh-modal-header">
          <div className="eh-modal-title-group">
            <Ticket size={20} aria-hidden="true" />
            <h3>Digital Event Pass</h3>
          </div>
          <button
            type="button"
            className="eh-modal-close"
            onClick={onClose}
            aria-label="Close pass modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="eh-modal-body">
          <div className="pass-ticket-banner">
            <div className="pass-ticket-banner-top">
              <span className="event-category-pill">{pass.event?.category || 'Event'}</span>
              <PassStatusBadge status={pass.displayStatus} />
            </div>
            <h4>{pass.event?.title}</h4>
            <p>
              {pass.student?.fullName} • {pass.student?.studentId}
            </p>
          </div>

          <div className="pass-ticket-details">
            <div className="status-cell">
              <div className="status-cell-label">Date &amp; Time</div>
              <div className="status-cell-value">
                <CalendarDays size={14} className="inline-icon" aria-hidden="true" />
                {formatEventDate(pass.event?.date)}
                {pass.event?.date ? ` • ${formatEventTime(pass.event.date)}` : ''}
              </div>
            </div>

            <div className="status-cell">
              <div className="status-cell-label">Venue</div>
              <div className="status-cell-value">
                <MapPin size={14} className="inline-icon" aria-hidden="true" />
                {pass.event?.venue || 'Campus Venue'}
              </div>
            </div>

            <div className="status-cell">
              <div className="status-cell-label">Registration ID</div>
              <div className="status-cell-value">
                <code>{pass.registrationCode}</code>
              </div>
            </div>

            <div className="status-cell">
              <div className="status-cell-label">Check-in Record</div>
              <div className="status-cell-value">
                {pass.checkedInAt
                  ? formatActivityDateTime(pass.checkedInAt)
                  : 'Not checked in'}
              </div>
            </div>
          </div>

          {pass.qrCode ? (
            <div className="pass-modal-qr-box">
              <img
                src={pass.qrCode}
                alt={`QR Pass for ${pass.event?.title}`}
                className={
                  pass.displayStatus === 'Cancelled' ||
                  pass.displayStatus === 'Event Cancelled' ||
                  pass.displayStatus === 'Missed/Expired'
                    ? 'is-inactive'
                    : ''
                }
              />
              <div className="pass-modal-qr-note">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>
                  Encodes an opaque single-use verification token (no personal details stored
                  in QR).
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ marginBlockStart: '1rem' }}>
              <p className="empty-state-copy">
                No active QR code is issued for this registration (Status: {pass.displayStatus}).
              </p>
            </div>
          )}
        </div>

        <div className="eh-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {isDownloadable && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={14} aria-hidden="true" />
              <span>{downloading ? 'Downloading...' : 'Download PDF Pass'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
