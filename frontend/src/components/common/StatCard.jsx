export default function StatCard({ label, value, hint, icon: Icon, loading = false }) {
  return (
    <article className={`card stat-card ${loading ? 'is-loading' : ''}`}>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {loading ? <span className="skeleton-line skeleton-value" /> : value}
        </div>
        {hint && (
          <div className="stat-hint">
            {loading ? <span className="skeleton-line skeleton-hint" /> : hint}
          </div>
        )}
      </div>
      {Icon && (
        <div className="stat-icon-box" aria-hidden="true">
          <Icon size={21} />
        </div>
      )}
    </article>
  );
}
