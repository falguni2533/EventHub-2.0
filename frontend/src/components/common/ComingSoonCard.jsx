import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ComingSoonCard({
  icon: Icon,
  title,
  description,
  targetPhase = 'Upcoming Phase',
  endpointHint,
  backTo,
}) {
  const { user } = useAuth();
  const dashboardPath = backTo || (user?.role === 'admin' ? '/admin' : '/');

  return (
    <section className="card placeholder-panel">
      {Icon && (
        <div className="placeholder-icon" aria-hidden="true">
          <Icon size={26} />
        </div>
      )}

      <div>
        <h3 className="card-title">{title}</h3>
        <p className="card-subtitle" style={{ marginBlockStart: '0.4rem' }}>
          {description}
        </p>
      </div>

      <div className="placeholder-meta">
        <span className="pill-badge">{targetPhase}</span>
        {endpointHint && (
          <span className="pill-badge">
            Planned API: <code>{endpointHint}</code>
          </span>
        )}
      </div>

      <Link to={dashboardPath} className="btn-secondary">
        <ArrowLeft size={15} />
        <span>Back to Dashboard</span>
      </Link>
    </section>
  );
}
