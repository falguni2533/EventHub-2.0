import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import { formatActivityDateTime } from '../../utils/dateFormat';

export function DashboardErrorBanner({ message, onRetry }) {
  return (
    <div className="dashboard-error-banner card" role="alert">
      <div className="dashboard-error-info">
        <AlertCircle size={20} aria-hidden="true" />
        <div>
          <strong>Unable to load dashboard data</strong>
          <p>{message}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionTo }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon" aria-hidden="true">
          <Icon size={22} />
        </div>
      )}
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-copy">{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-secondary empty-state-action">
          <span>{actionLabel}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

const ACTIVITY_ICON_MAP = {
  registration: ClipboardCheck,
  pass: Ticket,
  attendance: CheckCircle2,
  event: CalendarDays,
  student: GraduationCap,
};

export function ActivityFeed({
  title = 'Recent Activity',
  subtitle,
  items = [],
  loading = false,
  emptyTitle = 'No recent activity yet',
  emptyDescription = 'Real activity from your EventHub workspace will appear here.',
}) {
  return (
    <section className="card" aria-labelledby="recent-activity-heading">
      <div className="card-header">
        <div>
          <h3 id="recent-activity-heading" className="card-title">
            {title}
          </h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>

      {loading ? (
        <div className="activity-skeleton-list" aria-busy="true">
          {[1, 2, 3].map((row) => (
            <div key={row} className="activity-item is-skeleton">
              <span className="skeleton-circle" />
              <div className="activity-item-body">
                <span className="skeleton-line" style={{ inlineSize: '68%' }} />
                <span className="skeleton-line" style={{ inlineSize: '42%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <ul className="activity-list">
          {items.map((item) => {
            const Icon = ACTIVITY_ICON_MAP[item.type] || Clock;
            return (
              <li key={item.id} className="activity-item">
                <div className="activity-icon" aria-hidden="true">
                  <Icon size={16} />
                </div>
                <div className="activity-item-body">
                  <div className="activity-item-title">{item.title}</div>
                  <div className="activity-item-meta">
                    <span>{item.detail}</span>
                    <span aria-hidden="true">•</span>
                    <time dateTime={item.timestamp}>
                      {formatActivityDateTime(item.timestamp)}
                    </time>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function QuickActionsCard({ title = 'Quick Actions', subtitle, actions = [] }) {
  return (
    <section className="card" aria-labelledby="quick-actions-heading">
      <div className="card-header">
        <div>
          <h3 id="quick-actions-heading" className="card-title">
            {title}
          </h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="quick-actions-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.to} to={action.to} className="quick-action-tile">
              <div className="quick-action-icon" aria-hidden="true">
                <Icon size={19} />
              </div>
              <div className="quick-action-text">
                <span className="quick-action-label">{action.label}</span>
                {action.hint && (
                  <span className="quick-action-hint">{action.hint}</span>
                )}
              </div>
              <ArrowRight size={16} className="quick-action-arrow" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
