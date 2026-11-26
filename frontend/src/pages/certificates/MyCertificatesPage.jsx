import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import { DashboardErrorBanner, EmptyState } from '../../components/common/DashboardWidgets';
import CertificateCard from '../../components/certificates/CertificateCard';
import CertificatePreview from '../../components/certificates/CertificatePreview';
import { getMyCertificates } from '../../services/certificateService';

export default function MyCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewCert, setPreviewCert] = useState(null);

  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyCertificates();
      setCertificates(res?.data || []);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setError(err.message || 'Unable to load your certificates from EventHub.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const filteredCertificates = certificates.filter((cert) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      cert.eventName.toLowerCase().includes(q) ||
      cert.certificateId.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' ? true : cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = certificates.length;
  const validCount = certificates.filter((c) => c.status === 'valid').length;
  const revokedCount = certificates.filter((c) => c.status === 'revoked').length;

  return (
    <>
      <PageHeader
        badge="Student Panel • My Certificates"
        title="My Certificates"
        description="Access your verified event certificates, preview official credentials, and download high-resolution PDF awards."
        action={
          <button
            type="button"
            className="btn-hero-ghost"
            onClick={loadCertificates}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        }
      />

      {error && <DashboardErrorBanner message={error} onRetry={loadCertificates} />}

      <section className="stats-grid" aria-label="Certificate statistics">
        <StatCard
          label="Total Certificates"
          value={totalCount}
          hint="Issued to your student account"
          icon={Award}
          loading={loading}
        />
        <StatCard
          label="Verified & Valid"
          value={validCount}
          hint="Authentic credentials active in registry"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          label="Revoked Credentials"
          value={revokedCount}
          hint="Voided by event organizers"
          icon={AlertTriangle}
          loading={loading}
        />
        <StatCard
          label="Ready for Download"
          value={validCount}
          hint="Landscape PDF with QR verification"
          icon={FileCheck}
          loading={loading}
        />
      </section>

      <section className="card" aria-label="Issued certificates list">
        <div className="card-header">
          <div>
            <h3 className="card-title">Issued Credentials</h3>
            <p className="card-subtitle">
              Your verified participation achievements ready to share via QR or PDF.
            </p>
          </div>

          <div className="eh-filter-bar">
            <div className="eh-search-input-wrap">
              <Search size={15} className="eh-search-icon" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search event or certificate ID..."
                className="form-input eh-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="form-input eh-select-compact"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter certificates by status"
            >
              <option value="all">All Statuses</option>
              <option value="valid">Verified &amp; Valid</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="cert-grid" aria-busy="true">
            {[1, 2].map((item) => (
              <div key={item} className="card cert-card">
                <div className="cert-card-body">
                  <span className="skeleton-line" style={{ inlineSize: '42%' }} />
                  <span className="skeleton-line" style={{ inlineSize: '78%' }} />
                  <span className="skeleton-line" style={{ inlineSize: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCertificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No Certificates Found"
            description={
              searchTerm || statusFilter !== 'all'
                ? 'No certificates match your current search or filter criteria.'
                : 'Certificates appear here once an event organizer generates credentials for events where your attendance is marked present.'
            }
          />
        ) : (
          <div className="cert-grid">
            {filteredCertificates.map((cert) => (
              <CertificateCard
                key={cert.certificateId}
                certificate={cert}
                onPreview={(c) => setPreviewCert(c)}
              />
            ))}
          </div>
        )}
      </section>

      {previewCert && (
        <CertificatePreview
          certificate={previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </>
  );
}
