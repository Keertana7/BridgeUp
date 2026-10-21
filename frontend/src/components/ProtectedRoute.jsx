import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Wraps a route so it is only accessible to authenticated users.
 * While the session is loading (first render) it shows a spinner.
 * Once loaded, unauthenticated users are redirected to /login.
 */
export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) return <LoadingSpinner message="Checking authentication..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}
