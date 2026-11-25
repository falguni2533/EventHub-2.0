import { BadgeCheck, Building2, IdCard, Mail, Shield, UserCircle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../context/AuthContext';

export default function MyProfilePage() {
  const { user } = useAuth();

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString();
  };

  return (
    <>
      <PageHeader
        badge={`${user?.role === 'admin' ? 'Admin Panel' : 'Student Panel'} • My Profile`}
        title={user?.fullName || 'Account Profile'}
        description="Verified account information stored securely in MongoDB."
      />

      <section className="card" aria-labelledby="profile-details-heading">
        <div className="card-header">
          <div>
            <h3 id="profile-details-heading" className="card-title">
              Account Details
            </h3>
            <p className="card-subtitle">
              Authenticated via JWT and fetched from <code>GET /api/auth/me</code>
            </p>
          </div>
          <span className="pill-badge is-ok">
            <BadgeCheck size={14} aria-hidden="true" />
            <span>{user?.role === 'admin' ? 'Administrator' : 'Verified Student'}</span>
          </span>
        </div>

        <div className="status-matrix">
          <div className="status-cell">
            <div className="status-cell-label">
              <UserCircle size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
              Full Name
            </div>
            <div className="status-cell-value">{user?.fullName || '—'}</div>
          </div>

          <div className="status-cell">
            <div className="status-cell-label">
              <Mail size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
              Email Address
            </div>
            <div className="status-cell-value">{user?.email || '—'}</div>
          </div>

          <div className="status-cell">
            <div className="status-cell-label">
              <Building2 size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
              College Name
            </div>
            <div className="status-cell-value">{user?.collegeName || '—'}</div>
          </div>

          <div className="status-cell">
            <div className="status-cell-label">
              <IdCard size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
              {user?.role === 'admin' ? 'Admin / Staff ID' : 'Student ID'}
            </div>
            <div className="status-cell-value">{user?.studentId || '—'}</div>
          </div>

          <div className="status-cell">
            <div className="status-cell-label">
              <Shield size={13} style={{ verticalAlign: 'middle', marginInlineEnd: 4 }} />
              Role
            </div>
            <div className="status-cell-value" style={{ textTransform: 'capitalize' }}>
              {user?.role || '—'}
            </div>
          </div>

          <div className="status-cell">
            <div className="status-cell-label">Last Login</div>
            <div className="status-cell-value">{formatDate(user?.lastLoginAt)}</div>
          </div>
        </div>
      </section>
    </>
  );
}
