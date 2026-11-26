import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Download, ExternalLink, ShieldCheck, X } from 'lucide-react';
import {
  triggerCertificateDownload,
  verifyCertificate,
} from '../../services/certificateService';

export default function CertificatePreview({ certificate, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [qrCodeSrc, setQrCodeSrc] = useState(certificate?.qrCode || '');

  useEffect(() => {
    let active = true;
    setQrCodeSrc(certificate?.qrCode || '');

    if (certificate?.certificateId && !certificate?.qrCode) {
      verifyCertificate(certificate.certificateId)
        .then((res) => {
          if (active && res?.data?.qrCode) {
            setQrCodeSrc(res.data.qrCode);
          }
        })
        .catch(() => {
          // Keep placeholder if verification call fails transiently
        });
    }

    return () => {
      active = false;
    };
  }, [certificate]);

  if (!certificate) return null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await triggerCertificateDownload(certificate.certificateId);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error downloading PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return (
    <div className="eh-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="eh-modal-content is-large" onClick={(e) => e.stopPropagation()}>
        <div className="eh-modal-header">
          <div className="eh-modal-title-group">
            <ShieldCheck size={20} aria-hidden="true" />
            <h3>Certificate Preview — {certificate.certificateId}</h3>
          </div>
          <button
            type="button"
            className="eh-modal-close"
            onClick={onClose}
            aria-label="Close certificate preview"
          >
            <X size={18} />
          </button>
        </div>

        <div className="eh-modal-body">
          {certificate.status === 'revoked' && (
            <div className="eh-alert is-error" style={{ marginBlockEnd: '1rem' }}>
              <AlertCircle size={16} aria-hidden="true" />
              <span>
                <strong>Revoked Certificate:</strong> This credential is void. Reason:{' '}
                {certificate.revocationReason || 'Revoked by administrator'}
              </span>
            </div>
          )}

          {/* Preserved Certificate Visual Canvas */}
          <div className="cert-preview-frame">
            <div className="cert-preview-card">
              <div className="cert-preview-inner-border">
                <div className="cert-preview-brand">✦ EVENTHUB ✦</div>
                <div className="cert-preview-subbrand">
                  CAMPUS EVENT &amp; HACKATHON EXCELLENCE PORTAL
                </div>

                <div className="cert-preview-title">CERTIFICATE OF PARTICIPATION</div>

                <div className="cert-preview-recipient-lead">
                  This is proudly presented to
                </div>
                <div className="cert-preview-name">{certificate.participantName}</div>

                <p className="cert-preview-copy">
                  for active and meritorious participation in
                </p>
                <div className="cert-preview-event">{certificate.eventName}</div>

                <p className="cert-preview-date">
                  Date: {certificate.eventDate || formattedDate} • Organized under the
                  auspices of EventHub
                </p>

                <div className="cert-preview-footer">
                  <div>
                    <div className="cert-preview-footer-heading">Certificate Details</div>
                    <div>ID: {certificate.certificateId}</div>
                    <div>Issued: {formattedDate}</div>
                    <div
                      className={
                        certificate.status === 'revoked'
                          ? 'cert-preview-status-err'
                          : 'cert-preview-status-ok'
                      }
                    >
                      Status:{' '}
                      {certificate.status === 'revoked'
                        ? 'REVOKED'
                        : 'VALID & AUTHENTIC'}
                    </div>
                  </div>

                  <div className="cert-preview-sig">
                    <div className="cert-preview-sig-line" />
                    <div className="cert-preview-footer-heading">Dr. Rajesh Sharma</div>
                    <div className="cert-preview-sig-role">Faculty Coordinator</div>
                  </div>

                  <div className="cert-preview-qr-col">
                    <div className="cert-preview-qr-box">
                      {qrCodeSrc ? (
                        <img
                          src={qrCodeSrc}
                          alt={`QR Verification Code for ${certificate.certificateId}`}
                        />
                      ) : (
                        <span className="cert-preview-qr-loading">Loading QR...</span>
                      )}
                    </div>
                    <div className="cert-preview-qr-caption">Scan to Verify</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="eh-modal-footer">
          <Link
            to={`/verify/${certificate.certificateId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <ExternalLink size={14} aria-hidden="true" />
            <span>Public Verification Page</span>
          </Link>
          {certificate.status !== 'revoked' && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download size={14} aria-hidden="true" />
              <span>{downloading ? 'Downloading...' : 'Download Official PDF'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
