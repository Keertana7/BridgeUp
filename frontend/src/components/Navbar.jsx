import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-logo">🌉</span>
        <span className="navbar-name">BridgeUp</span>
      </Link>

      {isAuthenticated && (
        <div className="navbar-links">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Dashboard
          </NavLink>
          <NavLink to="/companies" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Companies
          </NavLink>
          <NavLink to="/questions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Questions
          </NavLink>
          <NavLink to="/ask-generate" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Ask &amp; Generate
          </NavLink>
          <NavLink to="/talk" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Emotional Support
          </NavLink>
          <NavLink to="/advice" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Advice
          </NavLink>
          <NavLink to="/resources" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Resources
          </NavLink>
        </div>
      )}

      <div className="navbar-right">
        {isAuthenticated ? (
          <>
            <span className="navbar-email">{user?.email}</span>
            <button className="btn btn-outline-sm" onClick={handleSignOut}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline-sm">Sign In</Link>
            <Link to="/signup" className="btn btn-primary-sm">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
