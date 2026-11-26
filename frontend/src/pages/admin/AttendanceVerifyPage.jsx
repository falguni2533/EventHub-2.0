import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertTriangle,
  Award,
  Camera,
  CameraOff,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Users,
  XCircle,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { DashboardErrorBanner, EmptyState } from '../../components/common/DashboardWidgets';
import PassStatusBadge from '../../components/passes/PassStatusBadge';
import CertificateStatus from '../../components/certificates/CertificateStatus';
import {
  checkInAdminPass,
  fetchAdminAttendanceOverview,
  verifyAdminPass,
} from '../../services/passService';
import {
  triggerCertificateDownload,
  verifyCertificate,
} from '../../services/certificateService';
import { formatActivityDateTime, formatEventDate } from '../../utils/dateFormat';

const QR_READER_ELEMENT_ID = 'eventhub-admin-qr-reader';

function extractCertificateId(rawInput) {
  const trimmed = String(rawInput || '').trim();
  const match = trimmed.match(/\/verify\/([^/?#]+)/i);
  if (match?.[1]) {
    return decodeURIComponent(match[1]).trim();
  }
  return trimmed;
}

export default function AttendanceVerifyPage() {
  // Strictly separated modes: Event Pass Check-in vs Certificate Lookup
  const [verifyMode, setVerifyMode] = useState('pass'); // 'pass' | 'certificate'

  // Overview & Logs state
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [overviewState, setOverviewState] = useState({
    loading: true,
    data: null,
    error: null,
  });

  // Pass Verification / Check-in state
  const [passInput, setPassInput] = useState('');
  const [passActionLoading, setPassActionLoading] = useState(false);
  const [passResult, setPassResult] = useState(null);
  const [passError, setPassError] = useState(null);

  // Camera Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const scannerRef = useRef(null);

  // Certificate Verification state
  const [certInput, setCertInput] = useState('');
  const [certLoading, setCertLoading] = useState(false);
  const [certResult, setCertResult] = useState(null);
  const [certError, setCertError] = useState(null);

  const loadOverview = useCallback(async () => {
    setOverviewState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchAdminAttendanceOverview(selectedEventId);
      setOverviewState({ loading: false, data, error: null });
    } catch (err) {
      setOverviewState({
        loading: false,
        data: null,
        error: err.message || 'Unable to load attendance logs.',
      });
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const stopCameraScanner = useCallback(async () => {
    const instance = scannerRef.current;
    scannerRef.current = null;
    if (instance) {
      try {
        if (instance.isScanning) {
          await instance.stop();
        }
        instance.clear();
      } catch {
        // Ignore cleanup failures if camera stream already closed
      }
    }
    setScannerOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, [stopCameraScanner]);

  const handleVerifyPass = async (tokenValue) => {
    const tokenToCheck = String(tokenValue ?? passInput).trim();
    if (!tokenToCheck) return;
    try {
      setPassActionLoading(true);
      setPassError(null);
      const data = await verifyAdminPass({
        token: tokenToCheck,
        eventId: selectedEventId,
      });
      setPassResult(data);
    } catch (err) {
      setPassResult(null);
      setPassError(err.message || 'Failed to verify event pass.');
    } finally {
      setPassActionLoading(false);
    }
  };

  const handleCheckInPass = async (tokenValue) => {
    const tokenToUse = String(tokenValue ?? passInput).trim();
    if (!tokenToUse) return;
    try {
      setPassActionLoading(true);
      setPassError(null);
      const data = await checkInAdminPass({
        token: tokenToUse,
        eventId: selectedEventId,
      });
      setPassResult(data);
      await loadOverview();
    } catch (err) {
      setPassError(err.message || 'Check-in rejected.');
    } finally {
      setPassActionLoading(false);
    }
  };

  const startCameraScanner = async () => {
    setScannerError(null);
    setScannerOpen(true);

    // Wait one frame for the QR reader container to mount
    requestAnimationFrame(async () => {
      try {
        const html5Qr = new Html5Qrcode(QR_READER_ELEMENT_ID);
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            await stopCameraScanner();
            if (verifyMode === 'certificate') {
              const extractedId = extractCertificateId(decodedText);
              setCertInput(extractedId);
              handleVerifyCertificate(extractedId);
            } else {
              setPassInput(decodedText);
              handleVerifyPass(decodedText);
            }
          },
          () => {
            // Ignore per-frame decode misses
          }
        );
      } catch (err) {
        setScannerError(
          err?.message ||
            'Camera unavailable or permission denied. You can paste/type the QR token or ID below.'
        );
        setScannerOpen(false);
      }
    });
  };

  const handleVerifyCertificate = async (overrideInput) => {
    const raw = overrideInput ?? certInput;
    const certId = extractCertificateId(raw);
    if (!certId) return;

    try {
      setCertLoading(true);
      setCertError(null);
      setCertResult(null);
      const res = await verifyCertificate(certId);
      setCertResult(res);
    } catch (err) {
      setCertResult(null);
      setCertError(
        err.status === 404
          ? `Certificate "${certId}" was not found in the EventHub registry.`
          : err.message || 'Unable to verify certificate.'
      );
    } finally {
      setCertLoading(false);
    }
  };

  const switchMode = (nextMode) => {
    if (scannerOpen) {
      stopCameraScanner();
    }
    setVerifyMode(nextMode);
  };

  const events = overviewState.data?.events || [];
  const records = overviewState.data?.records || [];
  const summary = overviewState.data?.summary || {
    total: 0,
    checkedIn: 0,
    pendingCheckIn: 0,
  };

  return (
    <>
      <PageHeader
        badge="Admin Panel • Verify QR / ID & Attendance"
        title="Verify QR / ID & Attendance"
        description="Scan student event passes for atomic venue check-in, or verify official certificate authenticity in a separate read-only lookup."
        action={
          <button
            type="button"
            className="btn-hero-ghost"
            onClick={loadOverview}
            disabled={overviewState.loading}
          >
            <RefreshCw
              size={15}
              className={overviewState.loading ? 'spin-icon' : ''}
              aria-hidden="true"
            />
            <span>Refresh Logs</span>
          </button>
        }
      />

      {overviewState.error && (
        <DashboardErrorBanner message={overviewState.error} onRetry={loadOverview} />
      )}

      <section className="stats-grid" aria-label="Attendance summary">
        <StatCard
          label="Active Registrations"
          value={summary.total}
          hint="Non-cancelled registrations in view"
          icon={Users}
          loading={overviewState.loading}
        />
        <StatCard
          label="Verified Check-ins"
          value={summary.checkedIn}
          hint="Attendance marked present"
          icon={ClipboardCheck}
          loading={overviewState.loading}
        />
        <StatCard
          label="Awaiting Check-in"
          value={summary.pendingCheckIn}
          hint="Confirmed passes not yet scanned"
          icon={Ticket}
          loading={overviewState.loading}
        />
      </section>

      {/* Unified Verify QR/ID Workspace with Strict Mode Separation */}
      <section className="card" aria-label="Verify QR or ID workspace">
        <div className="card-header">
          <div>
            <h3 className="card-title">Verification &amp; Check-In Desk</h3>
            <p className="card-subtitle">
              Choose the verification type below. Event Pass Check-In marks attendance;
              Certificate Verification is read-only.
            </p>
          </div>

          <div className="eh-tabs" role="tablist" aria-label="Verification mode">
            <button
              type="button"
              role="tab"
              aria-selected={verifyMode === 'pass'}
              className={`eh-tab-btn ${verifyMode === 'pass' ? 'is-active' : ''}`}
              onClick={() => switchMode('pass')}
            >
              <Ticket size={15} aria-hidden="true" />
              <span>Event Pass Verification</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={verifyMode === 'certificate'}
              className={`eh-tab-btn ${
                verifyMode === 'certificate' ? 'is-active' : ''
              }`}
              onClick={() => switchMode('certificate')}
            >
              <Award size={15} aria-hidden="true" />
              <span>Certificate Verification</span>
            </button>
          </div>
        </div>

        {/* Camera Scanner Toggle */}
        <div className="verify-scanner-bar">
          <div className="verify-scanner-hint">
            <QrCode size={16} aria-hidden="true" />
            <span>
              {verifyMode === 'pass'
                ? 'Mode: Event Entry Pass Scanner (Marks Attendance)'
                : 'Mode: Certificate Authenticity Scanner (Read-Only)'}
            </span>
          </div>
          {!scannerOpen ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={startCameraScanner}
            >
              <Camera size={15} aria-hidden="true" />
              <span>Scan with Camera</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-ghost-danger"
              onClick={stopCameraScanner}
            >
              <CameraOff size={15} aria-hidden="true" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>

        {scannerError && (
          <div className="eh-alert is-error" style={{ marginBlockEnd: '1rem' }}>
            <AlertTriangle size={16} aria-hidden="true" />
            <span>{scannerError}</span>
          </div>
        )}

        {scannerOpen && (
          <div className="verify-camera-box">
            <div id={QR_READER_ELEMENT_ID} className="verify-camera-viewport" />
          </div>
        )}

        {/* MODE 1: EVENT PASS VERIFICATION & CHECK-IN */}
        {verifyMode === 'pass' && (
          <div className="verify-mode-panel">
            <form
              className="verify-form-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyPass();
              }}
            >
              <div className="form-field" style={{ minInlineSize: '210px' }}>
                <label htmlFor="pass-event-scope" className="form-label">
                  Event Scope
                </label>
                <select
                  id="pass-event-scope"
                  className="form-input"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  <option value="all">All Events</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field" style={{ flex: 1, minInlineSize: '240px' }}>
                <label htmlFor="pass-token-input" className="form-label">
                  Pass QR Token or Pass Code
                </label>
                <input
                  id="pass-token-input"
                  type="text"
                  className="form-input"
                  placeholder="Scan QR or enter evhp_... / PASS-YYYY-XXXXXXXX"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                />
              </div>

              <div className="verify-form-actions">
                <button
                  type="submit"
                  className="btn-secondary"
                  disabled={passActionLoading || !passInput.trim()}
                >
                  <Search size={15} aria-hidden="true" />
                  <span>Verify Pass</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleCheckInPass()}
                  disabled={passActionLoading || !passInput.trim()}
                >
                  <ScanLine size={15} aria-hidden="true" />
                  <span>{passActionLoading ? 'Processing...' : 'Verify & Check In'}</span>
                </button>
              </div>
            </form>

            {passError && (
              <div className="eh-alert is-error" role="alert">
                <ShieldAlert size={17} aria-hidden="true" />
                <span>{passError}</span>
              </div>
            )}

            {passResult && (
              <div
                className={`verify-outcome-card ${
                  passResult.checkedIn
                    ? 'is-ok'
                    : passResult.eligible
                    ? 'is-ok'
                    : passResult.conflict
                    ? 'is-warn'
                    : 'is-err'
                }`}
              >
                <div className="verify-outcome-head">
                  <div className="verify-outcome-title-wrap">
                    {passResult.checkedIn || passResult.eligible ? (
                      <CheckCircle2 size={22} aria-hidden="true" />
                    ) : (
                      <XCircle size={22} aria-hidden="true" />
                    )}
                    <div>
                      <strong>
                        {passResult.checkedIn
                          ? 'Check-In Recorded'
                          : passResult.eligible
                          ? 'Pass Valid & Eligible for Entry'
                          : 'Pass Verification Alert'}
                      </strong>
                      <p>{passResult.message}</p>
                    </div>
                  </div>
                  <PassStatusBadge status={passResult.pass.displayStatus} />
                </div>

                <div className="status-matrix">
                  <div className="status-cell">
                    <div className="status-cell-label">Student</div>
                    <div className="status-cell-value">{passResult.student.fullName}</div>
                  </div>
                  <div className="status-cell">
                    <div className="status-cell-label">Student ID</div>
                    <div className="status-cell-value">{passResult.student.studentId}</div>
                  </div>
                  <div className="status-cell">
                    <div className="status-cell-label">Event</div>
                    <div className="status-cell-value">{passResult.event.title}</div>
                  </div>
                  <div className="status-cell">
                    <div className="status-cell-label">Registration Code</div>
                    <div className="status-cell-value">
                      <code>{passResult.pass.registrationCode}</code>
                    </div>
                  </div>
                </div>

                {passResult.eligible && !passResult.checkedIn && (
                  <div style={{ marginBlockStart: '0.85rem' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleCheckInPass()}
                      disabled={passActionLoading}
                    >
                      <CheckCircle2 size={15} aria-hidden="true" />
                      <span>Confirm &amp; Mark Attendance</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 2: CERTIFICATE VERIFICATION (READ-ONLY) */}
        {verifyMode === 'certificate' && (
          <div className="verify-mode-panel">
            <form
              className="verify-form-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyCertificate();
              }}
            >
              <div className="form-field" style={{ flex: 1, minInlineSize: '240px' }}>
                <label htmlFor="cert-id-verify-input" className="form-label">
                  Certificate ID or Verification URL
                </label>
                <input
                  id="cert-id-verify-input"
                  type="text"
                  className="form-input"
                  placeholder="Enter EVH-YYYY-XXXXXXXX or scan certificate QR"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                />
              </div>

              <div className="verify-form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={certLoading || !certInput.trim()}
                >
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>{certLoading ? 'Verifying...' : 'Verify Certificate'}</span>
                </button>
              </div>
            </form>

            {certError && (
              <div className="eh-alert is-error" role="alert">
                <XCircle size={17} aria-hidden="true" />
                <span>{certError}</span>
              </div>
            )}

            {certResult?.data && (
              <div
                className={`verify-outcome-card ${
                  certResult.data.status === 'valid' ? 'is-ok' : 'is-err'
                }`}
              >
                <div className="verify-outcome-head">
                  <div className="verify-outcome-title-wrap">
                    {certResult.data.status === 'valid' ? (
                      <CheckCircle2 size={22} aria-hidden="true" />
                    ) : (
                      <AlertTriangle size={22} aria-hidden="true" />
                    )}
                    <div>
                      <strong>
                        {certResult.data.status === 'valid'
                          ? 'Official Certificate Authentic'
                          : 'Certificate Revoked / Void'}
                      </strong>
                      <p>
                        {certResult.data.status === 'valid'
                          ? 'This credential is valid in the EventHub registry (read-only lookup).'
                          : certResult.data.revocationReason ||
                            'Revoked by event administrator.'}
                      </p>
                    </div>
                  </div>
                  <CertificateStatus status={certResult.data.status} />
                </div>

                <div className="status-matrix">
                  <div className="status-cell">
                    <div className="status-cell-label">Certificate ID</div>
                    <div className="status-cell-value">
                      <code>{certResult.data.certificateId}</code>
                    </div>
                  </div>
                  <div className="status-cell">
                    <div className="status-cell-label">Recipient</div>
                    <div className="status-cell-value">
                      {certResult.data.participantName}
                    </div>
                  </div>
                  <div className="status-cell">
                    <div className="status-cell-label">Event</div>
                    <div className="status-cell-value">{certResult.data.eventName}</div>
                  </div>
                  <div className="status-cell">
                    <div className="status-cell-label">Issued Date</div>
                    <div className="status-cell-value">
                      {formatEventDate(certResult.data.issueDate)}
                    </div>
                  </div>
                </div>

                <div className="eh-table-actions" style={{ marginBlockStart: '0.85rem' }}>
                  <Link
                    to={`/verify/${certResult.data.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    <span>Open Public Verification Page</span>
                  </Link>
                  {certResult.data.status !== 'revoked' && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() =>
                        triggerCertificateDownload(certResult.data.certificateId)
                      }
                    >
                      <Download size={14} aria-hidden="true" />
                      <span>Download PDF</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Attendance & Check-in Logs Table */}
      <section className="card" aria-label="Attendance check-in logs">
        <div className="card-header">
          <div>
            <h3 className="card-title">Event Attendance &amp; Pass Logs</h3>
            <p className="card-subtitle">
              Real-time check-in records enforced against duplicate scans.
            </p>
          </div>
        </div>

        {overviewState.loading ? (
          <div className="activity-skeleton-list" aria-busy="true">
            {[1, 2, 3].map((row) => (
              <div key={row} className="activity-item is-skeleton">
                <span className="skeleton-line" style={{ inlineSize: '100%' }} />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={ScanLine}
            title="No pass records found"
            description="Student check-ins and active event passes will appear here once registrations exist."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Event</th>
                  <th scope="col">Pass ID</th>
                  <th scope="col">Pass Status</th>
                  <th scope="col">Checked In</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.registrationId}>
                    <th scope="row">
                      <div className="table-primary-text">{rec.studentName}</div>
                      <div className="table-secondary-text">
                        {rec.studentId} • {rec.collegeName}
                      </div>
                    </th>
                    <td data-label="Event">
                      <div className="table-primary-text">{rec.eventTitle}</div>
                      <div className="table-secondary-text">
                        {formatEventDate(rec.eventDate)}
                      </div>
                    </td>
                    <td data-label="Pass ID">
                      <code className="cert-id-code">{rec.registrationCode}</code>
                    </td>
                    <td data-label="Pass Status">
                      <PassStatusBadge status={rec.displayStatus} />
                    </td>
                    <td data-label="Checked In">
                      {rec.checkedInAt ? (
                        <div>
                          <div className="table-primary-text">
                            {formatActivityDateTime(rec.checkedInAt)}
                          </div>
                          {rec.checkedInByName && (
                            <div className="table-secondary-text">
                              By {rec.checkedInByName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="table-secondary-text">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
