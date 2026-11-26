import React from 'react';
import './RecommendedCarousel.css';

export const RecommendedCarousel = ({ items }) => {
  if (!items?.length) return null;
  return (
    <section className="recommended-section">
      <h2 className="section-title">
        ✨ Recommended <span className="badge">Recommended</span>
      </h2>
      <div className="carousel">
        {items.map(({ event, score, reason }) => (
          <div key={event._id} className="card">
            {event.imageUrl && (
              <img src={event.imageUrl} alt={event.title} className="card-img" />
            )}
            <div className="card-body">
              <h3 className="card-title">{event.title}</h3>
              <p className="card-category">{event.category}</p>
              <p className="match-score">Match {Math.round(score)}%</p>
              <p className="reason">Why recommended: {reason}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
