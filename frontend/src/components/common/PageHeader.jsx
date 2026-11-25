import { Sparkles } from 'lucide-react';

export default function PageHeader({ badge, title, description, action }) {
  return (
    <section className="cosmic-hero" aria-label={title}>
      <div>
        {badge && (
          <div className="cosmic-hero-badge">
            <Sparkles size={14} aria-hidden="true" />
            <span>{badge}</span>
          </div>
        )}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </section>
  );
}
