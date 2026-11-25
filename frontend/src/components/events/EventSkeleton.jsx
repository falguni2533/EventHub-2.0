import './events.css';

export default function EventSkeleton() {
  return (
    <article className="eh-event-card eh-event-skeleton" aria-hidden="true">
      <div className="eh-event-banner" />
      <div className="eh-event-body">
        <span className="eh-event-badge eh-skeleton" />
        <h3 className="eh-event-title eh-skeleton" />
        <p className="eh-event-desc eh-skeleton" />
        <div className="eh-event-meta">
          <span className="eh-event-meta-item eh-skeleton" />
          <span className="eh-event-meta-item eh-skeleton" />
          <span className="eh-event-meta-item eh-skeleton" />
          <span className="eh-event-meta-item eh-skeleton" />
        </div>
        <div className="eh-event-seats eh-skeleton" />
        <div className="eh-event-price-badges eh-skeleton" />
        <button className="btn-primary eh-event-view-btn eh-skeleton" disabled />
      </div>
    </article>
  );
}
