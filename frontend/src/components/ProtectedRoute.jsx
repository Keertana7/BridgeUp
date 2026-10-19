/**
 * Wraps a page that requires authentication.
 * Redirects to /login if there is no active Supabase session.
 * Shows nothing while the initial session check is still loading.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    // Still checking — render nothing to avoid flash
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
