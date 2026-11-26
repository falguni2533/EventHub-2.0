import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Download,
  Search,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  triggerCertificateDownload,
  verifyCertificate,
} from '../../services/certificateService';
import { useAuth } from '../../context/AuthContext';

export default function VerifyCertificatePage() {
  const { certificateId: paramCertId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [inputCertId, setInputCertId] = useState(paramCertId || '');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [errorState, setErrorState] = useState(null);

  const performVerification = useCallback(async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;
    try {
      setLoading(true);
      setErrorState(null);
      setVerificationResult(null);

      const res = await verifyCertificate(idToVerify.trim());
      setVerificationResult(res);
    } catch (err) {
      if (err.status === 404) {
        setErrorState({
          type: 'not_found',
          message:
            'Certificate Not Found. This certificate ID could not be verified in the EventHub registry.',
        });
      } else {
        setErrorState({
          type: 'server_error',
          message:
            err.message ||
            'Unable to connect to the EventHub verification server. Please try again shortly.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paramCertId) {
      setInputCertId(paramCertId);
      performVerification(paramCertId);
    } else {
      setInputCertId('');
      setVerificationResult(null);
      setErrorState(null);
    }
  }, [paramCertId, performVerification]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputCertId.trim();
    if (!trimmed) return;
    if (trimmed.toUpperCase() === (paramCertId || '').trim().toUpperCase()) {
      performVerification(trimmed);
    } else {
      navigate(`/verify/${encodeURIComponent(trimmed)}`);
    }
  };

  const certData = verificationResult?.data;
  const backTarget = !isAuthenticated
    ? '/login'
    : user?.role === 'admin'
    ? '/admin/certificates'
    : '/certificates';

  return (
    <div className="verify-page-container">
      <div className="verify-brand-bar">
        <div className="brand-logo" aria-hidden="true">
          <Sparkles size={20} />
        </div>
        <div className="verify-brand-title font-display">
          EventHub <span>Registry</span>
        </div>
      </div>

      <div className="verify-page-heading">
        <h1>Official Certificate Verification</h1>
        <p>
          Verify the authenticity and integrity of an EventHub issued credential.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="verify-search-form">
        <div className="verify-search-row">
          <div className="eh-search-input-wrap" style={{ flex: 1 }}>
            <Search size={17} className="eh-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g. EVH-2026-A7F39C2B)"
              className="form-input eh-search-input"
              value={inputCertId}
              onChange={(e) => setInputCertId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>

      <div className="verify-card">
        {!verificationResult && !errorState && !loading && (
          <div className="verify-empty-body">
            <ShieldCheck size={46} color="#6d28d9" aria-hidden="true" />
            <h3>Instant Authenticity Check</h3>
            <p>
              Scan the QR code on any EventHub certificate or enter the unique Certificate
              ID above to verify its validity.
            </p>
          </div>
        )}

        {loading && (
          <div className="verify-empty-body">
            <Award size={40} color="#6d28d9" className="spin-icon" aria-hidden="true" />
            <p>Querying EventHub Certificate Registry...</p>
          </div>
        )}

        {certData && certData.status === 'valid' && (
          <>
            <div className="verify-header-badge valid">
              <div className="verify-status-icon valid">
                <CheckCircle2 size={34} aria-hidden="true" />
              </div>
              <h2 className="verify-status-title valid">Certificate Verified</h2>
              <p className="verify-status-desc">
                This credential is authentic and was issued by EventHub.
              </p>
            </div>

            <div className="verify-details-section">
              <div className="verify-grid">
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Participant Name</span>
                  <span className="verify-grid-value">{certData.participantName}</span>
                </div>
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Certificate ID</span>
                  <span className="verify-grid-value">
                    <code>{certData.certificateId}</code>
                  </span>
                </div>
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Event Name</span>
                  <span className="verify-grid-value">{certData.eventName}</span>
                </div>
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Event Date</span>
                  <span className="verify-grid-value">
                    {certData.eventDate || 'Completed'}
                  </span>
                </div>
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Date Issued</span>
                  <span className="verify-grid-value">
                    {new Date(certData.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Issuing Authority</span>
                  <span className="verify-grid-value">
                    {certData.organizer || 'EventHub Academic Registry'}
                  </span>
                </div>
              </div>

              {certData.qrCode && (
                <div className="verify-qr-box">
                  <img src={certData.qrCode} alt="Verification QR" />
                  <span>Scan QR code to open this verification report</span>
                </div>
              )}

              <div className="verify-actions-center">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => triggerCertificateDownload(certData.certificateId)}
                >
                  <Download size={14} aria-hidden="true" />
                  <span>Download Verified PDF</span>
                </button>
              </div>
            </div>
          </>
        )}

        {certData && certData.status === 'revoked' && (
          <>
            <div className="verify-header-badge revoked">
              <div className="verify-status-icon revoked">
                <AlertTriangle size={34} aria-hidden="true" />
              </div>
              <h2 className="verify-status-title revoked">Certificate Revoked</h2>
              <p className="verify-status-desc" style={{ color: '#991b1b' }}>
                This certificate has been declared VOID and is no longer valid.
              </p>
            </div>

            <div className="verify-details-section">
              <div className="eh-alert is-error" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <strong>Revocation Notice:</strong>
                <span>
                  {certData.revocationReason || 'Revoked by authorized administrator.'}
                </span>
                {certData.revokedAt && (
                  <small>
                    Revoked on: {new Date(certData.revokedAt).toLocaleString()}
                  </small>
                )}
              </div>

              <div className="verify-grid">
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Originally Issued To</span>
                  <span className="verify-grid-value">{certData.participantName}</span>
                </div>
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Certificate ID</span>
                  <span className="verify-grid-value">
                    <code>{certData.certificateId}</code>
                  </span>
                </div>
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Event Name</span>
                  <span className="verify-grid-value">{certData.eventName}</span>
                </div>
                <div className="verify-grid-item">
                  <span className="verify-grid-label">Status</span>
                  <span className="verify-grid-value" style={{ color: '#b91c1c' }}>
                    VOID / REVOKED
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {errorState && errorState.type === 'not_found' && (
          <div className="verify-header-badge invalid">
            <div className="verify-status-icon invalid">
              <XCircle size={34} aria-hidden="true" />
            </div>
            <h2 className="verify-status-title invalid">Certificate Not Found</h2>
            <p className="verify-status-desc">
              The certificate ID &ldquo;<strong>{inputCertId}</strong>&rdquo; does not
              exist in the EventHub registry.
            </p>
          </div>
        )}

        {errorState && errorState.type === 'server_error' && (
          <div className="verify-empty-body">
            <AlertTriangle size={36} color="#b45309" aria-hidden="true" />
            <p style={{ color: '#b91c1c', fontWeight: 600 }}>{errorState.message}</p>
          </div>
        )}
      </div>

      <div className="verify-back-wrap">
        <Link to={backTarget} className="btn-secondary">
          <ArrowLeft size={14} aria-hidden="true" />
          <span>{isAuthenticated ? 'Back to EventHub' : 'Sign In to EventHub'}</span>
        </Link>
      </div>
    </div>
  );
}
