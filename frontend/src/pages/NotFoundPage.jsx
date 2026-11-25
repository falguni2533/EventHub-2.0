import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <section className="card placeholder-panel">
      <div className="placeholder-icon" aria-hidden="true">
        <Compass size={26} />
      </div>
      <div>
        <h2 className="card-title">Page Not Found</h2>
        <p className="card-subtitle" style={{ marginBlockStart: '0.35rem' }}>
          The requested Student Panel route does not exist.
        </p>
      </div>
      <Link to="/" className="btn-primary">
        Return to Dashboard
      </Link>
    </section>
  );
}
