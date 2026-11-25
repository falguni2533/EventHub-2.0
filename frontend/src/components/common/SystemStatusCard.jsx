import { RefreshCw, Server, Database } from 'lucide-react';

export default function SystemStatusCard({ healthState, onRefresh }) {
  const { loading, data, error } = healthState;
  const db = data?.database;

  return (
    <section className="card" aria-labelledby="system-status-heading">
      <div className="card-header">
        <div>
          <h3 id="system-status-heading" className="card-title">
            Backend &amp; MongoDB Connectivity
          </h3>
          <p className="card-subtitle">
            Live verification via Axios <code>GET /api/health</code>
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={15} />
          <span>{loading ? 'Checking...' : 'Re-check'}</span>
        </button>
      </div>

      {error ? (
        <div className="pill-badge is-err">
          <Server size={15} />
          <span>Connection Error: {error}</span>
        </div>
      ) : (
        <div className="status-matrix">
          <div className="status-cell">
            <div className="status-cell-label">API Server</div>
            <div className="status-cell-value">
              {loading ? 'Checking...' : data?.service || 'Online'}
            </div>
          </div>

          <div className="status-cell">
            <div className="status-cell-label">API Latency</div>
            <div className="status-cell-value">
              {loading ? '—' : `${data?.latencyMs ?? 0} ms`}
            </div>
          </div>

          <div className="status-cell">
            <div className="status-cell-label">MongoDB State</div>
            <div className="status-cell-value">
              <Database
                size={14}
                style={{ verticalAlign: 'middle', marginInlineEnd: 6 }}
              />
              {loading ? 'Checking...' : db?.state || 'unknown'}
            </div>
          </div>

          <div className="status-cell">
            <div className="status-cell-label">Database Name</div>
            <div className="status-cell-value">
              {loading
                ? '—'
                : db?.name || (db?.configured ? 'Not connected' : 'URI not set in .env')}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
