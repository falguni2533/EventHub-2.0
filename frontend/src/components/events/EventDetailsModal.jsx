import { X, Calendar, Clock, MapPin, Tag } from 'lucide-react';
import { useEffect, useRef } from 'react';
import './events.css';

export default function EventDetailsModal({ event, onClose }) {
  const { title, description, category, date, time, venue, organizer, seatsTotal, seatsFilled, isFree, price, image } = event;
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Focus trap – return focus after close
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const focusable = modalRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  const seatsLeft = seatsTotal - seatsFilled;
  const soldOut = seatsLeft <= 0;

  // Category‑based banner gradient
  const gradients = {
    Technical: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
    Cultural: 'linear-gradient(135deg, #c084fc, #a78bfa)',
    Sports: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    Workshop: 'linear-gradient(135deg, #f59e0b, #d97706)',
    Seminar: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    Default: 'var(--accent-primary)',
  };
  const bannerStyle = { '--banner-bg': gradients[category] || gradients.Default };

  return (
    <div className="eh-modal-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="eh-modal" ref={modalRef} onClick={(e) => e.stopPropagation()} style={bannerStyle}>
        <button className="eh-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} aria-hidden="true" />
        </button>
        {image && <img src={image} alt={title} className="eh-modal-image" loading="lazy" />}
        <h2 className="eh-modal-title">{title}</h2>
        <span className="eh-event-badge eh-modal-badge" style={{ background: bannerStyle['--banner-bg'] }}>{category}</span>
        <p className="eh-modal-description">{description}</p>
        <div className="eh-modal-meta">
          <span><Calendar size={14} aria-hidden="true" /> {date}</span>
          <span><Clock size={14} aria-hidden="true" /> {time}</span>
          <span><MapPin size={14} aria-hidden="true" /> {venue}</span>
          <span><Tag size={14} aria-hidden="true" /> {organizer}</span>
        </div>
        <div className="eh-modal-seats">
          <div className="eh-event-seats-progress" aria-label={`${seatsFilled} of ${seatsTotal} seats taken`}>
            <div className="eh-event-seats-fill" style={{ width: `${(seatsFilled / seatsTotal) * 100}%` }} />
          </div>
          <span>{seatsLeft} seats left</span>
        </div>
        <div className="eh-modal-price">
          {isFree ? (
            <span className="eh-event-price-tag eh-event-price-free">Free</span>
          ) : (
            <span className="eh-event-price-tag">₹{price}</span>
          )}
          {soldOut && <span className="eh-event-soldout-badge">Sold Out</span>}
        </div>
      </div>
    </div>
  );
}
