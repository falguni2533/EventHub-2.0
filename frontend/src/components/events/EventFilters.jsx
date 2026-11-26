import { Search, X } from 'lucide-react';
import './events.css';

const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar'];

export default function EventFilters({ search, setSearch, category, setCategory }) {
  return (
    <section className="eh-events-filters" aria-label="Event filters">
      <div className="eh-events-search">
        <Search size={16} className="eh-events-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by title or venue"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search events"
          className="eh-events-search-input"
        />
        {search && (
          <button
            type="button"
            className="eh-events-clear-btn"
            onClick={() => setSearch('')}
            aria-label="Clear search"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="eh-events-categories" role="group" aria-label="Event categories">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`eh-events-category-chip ${category === c ? 'active' : ''}`}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
          >
            {c}
          </button>
        ))}
      </div>
    </section>
  );
}
