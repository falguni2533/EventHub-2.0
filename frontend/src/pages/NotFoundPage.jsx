import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const homePath = isAdmin ? '/admin' : '/';

  return (
    <section className="card placeholder-panel">
      <div className="placeholder-icon" aria-hidden="true">
        <Compass size={26} />
      </div>
      <div>
        <h2 className="card-title">Page Not Found</h2>
        <p className="card-subtitle" style={{ marginBlockStart: '0.35rem' }}>
          The requested {isAdmin ? 'Admin Panel' : 'Student Panel'} route does not exist.
        </p>
      </div>
      <Link to={homePath} className="btn-primary">
        Return to Dashboard
      </Link>
    </section>
  );
}
