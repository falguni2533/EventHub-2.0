import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Ban,
  CheckCircle2,
  Download,
  Eye,
  PlusCircle,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { DashboardErrorBanner, EmptyState } from '../../components/common/DashboardWidgets';
import CertificateStatus from '../../components/certificates/CertificateStatus';
import CertificatePreview from '../../components/certificates/CertificatePreview';
import {
  generateEventCertificates,
  generateSingleCertificate,
  getEventsWithParticipants,
  revokeCertificate,
  triggerCertificateDownload,
} from '../../services/certificateService';

export default function ManageCertificatesPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [revokeModalData, setRevokeModalData] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await getEventsWithParticipants();
      const eventList = res?.data || [];
      setEvents(eventList);
      setSelectedEventId((prev) =>
        prev && eventList.some((e) => e.eventId === prev)
          ? prev
          : eventList[0]?.eventId || ''
      );
    } catch (err) {
      console.error(err);
      setLoadError(err.message || 'Failed to fetch event and participant data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentEvent =
    events.find((e) => e.eventId === selectedEventId) || events[0] || null;
  const participants = currentEvent?.participants || [];

  const filteredParticipants = participants.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      p.participantName.toLowerCase().includes(q) ||
      p.participantEmail.toLowerCase().includes(q) ||
      p.studentRollId?.toLowerCase().includes(q) ||
      (p.certificate && p.certificate.certificateId.toLowerCase().includes(q))
    );
  });

  const totalParticipants = participants.length;
  const eligibleCount = participants.filter((p) => p.attendance === 'present').length;
  const generatedCount = participants.filter(
    (p) => p.certificate && p.certificate.status === 'valid'
  ).length;
  const revokedCount = participants.filter(
    (p) => p.certificate && p.certificate.status === 'revoked'
  ).length;
  const unissuedEligibleCount = participants.filter(
    (p) => p.attendance === 'present' && !p.certificate
  ).length;

  const handleBulkGenerate = async () => {
    if (!currentEvent) return;
    try {
      setActionLoading(true);
      setBulkModalOpen(false);
      const res = await generateEventCertificates(currentEvent.eventId);
      setAlert({
        type: 'success',
        message: `Generated ${res.summary.certificatesGenerated} new certificate(s) for ${currentEvent.eventName}. (${res.summary.alreadyIssued} already issued, ${res.summary.ineligibleParticipants} ineligible skipped)`,
      });
      await loadData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to generate certificates.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleGenerate = async (participant) => {
    if (!currentEvent) return;
    try {
      setActionLoading(true);
      const res = await generateSingleCertificate(
        currentEvent.eventId,
        participant.participantId
      );
      setAlert({
        type: 'success',
        message: `Certificate ${res.data.certificateId} generated for ${participant.participantName}.`,
      });
      await loadData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to generate certificate.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeModalData) return;
    try {
      setActionLoading(true);
      await revokeCertificate(revokeModalData.certificateId, revokeReason);
      setAlert({
        type: 'success',
        message: `Certificate ${revokeModalData.certificateId} has been officially revoked.`,
      });
      setRevokeModalData(null);
      setRevokeReason('');
      await loadData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to revoke certificate.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        badge="Admin Panel • Manage Certificates"
        title="Certificate Management"
        description="Verify attendance eligibility, issue individual or bulk PDF certificates with QR codes, and manage revocations."
        action={
          <button
            type="button"
            className="btn-hero-ghost"
            onClick={loadData}
            disabled={loading || actionLoading}
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} aria-hidden="true" />
            <span>Refresh Records</span>
          </button>
        }
      />

      {loadError && <DashboardErrorBanner message={loadError} onRetry={loadData} />}

      {alert && (
        <div
          className={`eh-alert ${alert.type === 'error' ? 'is-error' : 'is-success'}`}
          role="status"
        >
          <span>{alert.message}</span>
          <button
            type="button"
            className="eh-alert-dismiss"
            onClick={() => setAlert(null)}
            aria-label="Dismiss alert"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <section className="stats-grid" aria-label="Event certificate summary">
        <StatCard
          label="Total Registered"
          value={totalParticipants}
          hint="Non-cancelled participants in selected event"
          icon={Users}
          loading={loading}
        />
        <StatCard
          label="Eligible (Present)"
          value={eligibleCount}
          hint="Verified present attendance"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          label="Certificates Issued"
          value={generatedCount}
          hint="Active valid certificates"
          icon={Award}
          loading={loading}
        />
        <StatCard
          label="Revoked Credentials"
          value={revokedCount}
          hint="Voided with audit reason"
          icon={AlertTriangle}
          loading={loading}
        />
      </section>

      <section className="card" aria-label="Event participant certificate table">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              {currentEvent ? currentEvent.eventName : 'Event Participants'}
            </h3>
            <p className="card-subtitle">
              Eligibility rule: Participant must be confirmed and marked{' '}
              <strong>Present</strong>. Absent or unchecked-in participants are ineligible.
            </p>
          </div>

          <div className="eh-filter-bar">
            <select
              className="form-input eh-select-compact"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              aria-label="Select event"
              disabled={events.length === 0}
            >
              {events.length === 0 ? (
                <option value="">No events available</option>
              ) : (
                events.map((evt) => (
                  <option key={evt.eventId} value={evt.eventId}>
                    {evt.eventName} ({evt.category})
                  </option>
                ))
              )}
            </select>

            <div className="eh-search-input-wrap">
              <Search size={15} className="eh-search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search student or cert ID..."
                className="form-input eh-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setBulkModalOpen(true)}
              disabled={actionLoading || unissuedEligibleCount === 0}
            >
              <PlusCircle size={15} aria-hidden="true" />
              <span>Generate All Eligible ({unissuedEligibleCount})</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="activity-skeleton-list" aria-busy="true">
            {[1, 2, 3].map((row) => (
              <div key={row} className="activity-item is-skeleton">
                <span className="skeleton-line" style={{ inlineSize: '100%' }} />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No events found"
            description="Once campus events and student registrations exist in MongoDB, you can issue and manage certificates here."
          />
        ) : filteredParticipants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No matching participants"
            description="No registered participants match the current event or search filter."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Participant</th>
                  <th scope="col">Attendance</th>
                  <th scope="col">Certificate Status</th>
                  <th scope="col">Certificate ID</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.map((p) => {
                  const isEligible = p.attendance === 'present';
                  const hasCert = Boolean(p.certificate);
                  const certStatus = p.certificate
                    ? p.certificate.status
                    : 'not_generated';

                  return (
                    <tr key={`${p.participantId}-${p.eventId}`}>
                      <th scope="row">
                        <div className="table-primary-text">{p.participantName}</div>
                        <div className="table-secondary-text">
                          {p.studentRollId ? `${p.studentRollId} • ` : ''}
                          {p.participantEmail}
                        </div>
                      </th>
                      <td data-label="Attendance">
                        <CertificateStatus status={p.attendance} type="attendance" />
                      </td>
                      <td data-label="Certificate Status">
                        <CertificateStatus status={certStatus} />
                      </td>
                      <td data-label="Certificate ID">
                        {hasCert ? (
                          <code className="cert-id-code">{p.certificate.certificateId}</code>
                        ) : (
                          <span className="table-secondary-text">—</span>
                        )}
                      </td>
                      <td data-label="Actions">
                        <div className="eh-table-actions">
                          {!hasCert && isEligible && (
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleSingleGenerate(p)}
                              disabled={actionLoading}
                            >
                              Generate
                            </button>
                          )}

                          {!hasCert && !isEligible && (
                            <span className="table-secondary-text">
                              Ineligible (Not Present)
                            </span>
                          )}

                          {hasCert && (
                            <>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setPreviewCert(p.certificate)}
                              >
                                <Eye size={13} aria-hidden="true" />
                                <span>Preview</span>
                              </button>
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() =>
                                  triggerCertificateDownload(p.certificate.certificateId)
                                }
                                title="Download PDF"
                                aria-label={`Download ${p.certificate.certificateId}`}
                              >
                                <Download size={13} aria-hidden="true" />
                              </button>
                            </>
                          )}

                          {hasCert && certStatus === 'valid' && (
                            <button
                              type="button"
                              className="btn-ghost-danger"
                              onClick={() => setRevokeModalData(p.certificate)}
                            >
                              <Ban size={13} aria-hidden="true" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bulk Generate Modal */}
      {bulkModalOpen && (
        <div
          className="eh-modal-overlay"
          onClick={() => setBulkModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="eh-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="eh-modal-header">
              <div className="eh-modal-title-group">
                <Award size={19} aria-hidden="true" />
                <h3>Confirm Bulk Certificate Generation</h3>
              </div>
              <button
                type="button"
                className="eh-modal-close"
                onClick={() => setBulkModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="eh-modal-body">
              <p className="card-subtitle" style={{ marginBlockEnd: '1rem' }}>
                Generate certificates for all eligible present participants of{' '}
                <strong>{currentEvent?.eventName}</strong>?
              </p>
              <div className="checklist">
                <div className="checklist-item">
                  <span>
                    Eligible Present Participants: <strong>{eligibleCount}</strong>
                  </span>
                </div>
                <div className="checklist-item">
                  <span>
                    Already Issued: <strong>{generatedCount + revokedCount}</strong>
                  </span>
                </div>
                <div className="checklist-item">
                  <span>
                    New Certificates to Generate:{' '}
                    <strong>{unissuedEligibleCount}</strong>
                  </span>
                </div>
                <div className="checklist-item">
                  <span>
                    Ineligible (Absent / Not Marked):{' '}
                    <strong>{totalParticipants - eligibleCount}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="eh-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setBulkModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleBulkGenerate}
                disabled={actionLoading}
              >
                {actionLoading ? 'Generating...' : 'Confirm & Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModalData && (
        <div
          className="eh-modal-overlay"
          onClick={() => setRevokeModalData(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="eh-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="eh-modal-header">
              <div className="eh-modal-title-group">
                <Ban size={19} color="#b91c1c" aria-hidden="true" />
                <h3>Revoke Certificate</h3>
              </div>
              <button
                type="button"
                className="eh-modal-close"
                onClick={() => setRevokeModalData(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <div className="eh-modal-body">
              <p className="card-subtitle" style={{ marginBlockEnd: '0.85rem' }}>
                You are revoking certificate{' '}
                <strong>{revokeModalData.certificateId}</strong> for{' '}
                <strong>{revokeModalData.participantName}</strong>.
              </p>
              <div className="eh-alert is-error" style={{ marginBlockEnd: '1rem' }}>
                Once revoked, public verification scans will permanently display this
                certificate as REVOKED.
              </div>
              <div className="form-field">
                <label htmlFor="revoke-reason-input" className="form-label">
                  Revocation Reason (Optional)
                </label>
                <textarea
                  id="revoke-reason-input"
                  rows={3}
                  className="form-input"
                  placeholder="e.g. Attendance record dispute or post-event audit violation."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                />
              </div>
            </div>
            <div className="eh-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRevokeModalData(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-ghost-danger"
                onClick={handleConfirmRevoke}
                disabled={actionLoading}
              >
                {actionLoading ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewCert && (
        <CertificatePreview
          certificate={previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </>
  );
}
