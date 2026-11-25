export default function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <article className="card stat-card">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
      {Icon && (
        <div className="stat-icon-box" aria-hidden="true">
          <Icon size={22} />
        </div>
      )}
    </article>
  );
}
