import { Calendar, Clock, MapPin, Tag } from 'lucide-react';
import './events.css';

const categoryStyles = {
  Technical: { banner: 'linear-gradient(135deg, #6d28d9, #7c3aed)', badge: '#7c3aed' },
  Cultural: { banner: 'linear-gradient(135deg, #c084fc, #a78bfa)', badge: '#c084fc' },
  Sports: { banner: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', badge: '#38bdf8' },
  Workshop: { banner: 'linear-gradient(135deg, #f59e0b, #d97706)', badge: '#f59e0b' },
  Seminar: { banner: 'linear-gradient(135deg, #3b82f6, #2563eb)', badge: '#3b82f6' },
  Default: { banner: 'var(--accent-primary)', badge: 'var(--accent-primary)' },
};

export default function EventCard({ event, onViewDetails }) {
  const { title, description, category, date, time, venue, organizer, seatsTotal, seatsFilled, isFree, price, image } = event;
  const styles = categoryStyles[category] || categoryStyles.Default;
  const seatsLeft = seatsTotal - seatsFilled;
  const soldOut = seatsLeft <= 0;

  return (
    <article className="eh-event-card" style={{ '--banner-bg': styles.banner }}>
      {/* Image thumbnail */}
      {image && (
        <img src={image} alt={title} className="eh-event-image" loading="lazy" />
      )}
      <div className="eh-event-banner" />
      <div className="eh-event-body">
        <span className="eh-event-badge" style={{ background: styles.badge }}>{category}</span>
        <h3 className="eh-event-title">{title}</h3>
        <p className="eh-event-desc">{description}</p>
        <div className="eh-event-meta">
          <span className="eh-event-meta-item"><Calendar size={14} aria-hidden="true" /> {date}</span>
          <span className="eh-event-meta-item"><Clock size={14} aria-hidden="true" /> {time}</span>
          <span className="eh-event-meta-item"><MapPin size={14} aria-hidden="true" /> {venue}</span>
          <span className="eh-event-meta-item"><Tag size={14} aria-hidden="true" /> {organizer}</span>
        </div>
        <div className="eh-event-seats">
          <div className="eh-event-seats-progress" aria-label={`${seatsFilled} of ${seatsTotal} seats taken`}>
            <div className="eh-event-seats-fill" style={{ width: `${(seatsFilled / seatsTotal) * 100}%` }} />
          </div>
          <span className="eh-event-seats-text">{seatsLeft} seats left</span>
        </div>
        <div className="eh-event-price-badges">
          {isFree ? (
            <span className="eh-event-price-tag eh-event-price-free">Free</span>
          ) : (
            <span className="eh-event-price-tag">₹{price}</span>
          )}
          {soldOut && <span className="eh-event-soldout-badge">Sold Out</span>}
        </div>
        <button className="btn-primary eh-event-view-btn" onClick={onViewDetails}>View Details</button>
      </div>
    </article>
  );
}
