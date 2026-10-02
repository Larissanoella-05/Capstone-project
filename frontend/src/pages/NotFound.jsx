import { Link } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext.jsx';

export default function NotFound() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper p-6">
      <div className="panel w-full max-w-md p-6">
        <div className="eyebrow text-muted">Error 404</div>
        <h1 className="display mt-2 text-3xl">Page not found</h1>
        <p className="mt-3 text-sm">The address may be mistyped, or the page may have moved.</p>
        <Link to={user ? HOME_BY_ROLE[user.role] : '/login'} className="btn btn-ink mt-5">
          {user ? 'Back to my dashboard' : 'Go to sign in'}
        </Link>
      </div>
    </div>
  );
}
