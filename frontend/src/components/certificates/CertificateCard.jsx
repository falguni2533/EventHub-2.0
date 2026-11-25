import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Download, ExternalLink, Eye, Sparkles, User } from 'lucide-react';
import CertificateStatus from './CertificateStatus';
import { triggerCertificateDownload } from '../../services/certificateService';

export default function CertificateCard({ certificate, onPreview }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      setDownloading(true);
      await triggerCertificateDownload(certificate.certificateId);
    } catch (err) {
      console.error('Download failed:', err);
      alert(err.message || 'Failed to download certificate PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const formattedIssueDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <article
      className={`card cert-card ${certificate.status === 'revoked' ? 'is-revoked' : ''}`}
    >
      <div className="cert-card-accent" aria-hidden="true" />
      <div className="cert-card-body">
        <div className="cert-card-top">
          <span className="event-category-pill">
            <Sparkles size={11} className="inline-icon" aria-hidden="true" />
            Official Certificate
          </span>
          <code className="cert-id-code">{certificate.certificateId}</code>
        </div>

        <h3 className="cert-card-title">{certificate.eventName}</h3>

        <div className="cert-card-recipient">
          <User size={15} aria-hidden="true" />
          <span>{certificate.participantName}</span>
        </div>

        <div className="cert-card-meta">
          <div className="cert-meta-row">
            <Calendar size={14} aria-hidden="true" />
            <span>Event Date: {certificate.eventDate || 'Completed'}</span>
          </div>
          <div className="cert-meta-row">
            <Calendar size={14} aria-hidden="true" />
            <span>Issued: {formattedIssueDate}</span>
          </div>
          <div className="cert-meta-row">
            <CertificateStatus status={certificate.status} />
          </div>
        </div>

        <div className="cert-card-actions">
          <button
            type="button"
            className="btn-primary cert-action-grow"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download size={14} aria-hidden="true" />
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onPreview(certificate)}
          >
            <Eye size={14} aria-hidden="true" />
            <span>Preview</span>
          </button>

          <Link
            to={`/verify/${certificate.certificateId}`}
            className="btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
            title="Public Verification Page"
            aria-label={`Verify ${certificate.certificateId}`}
          >
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
