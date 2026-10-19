import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <nav className="nav-root">
      <div className="nav-inner">
        <NavLink to="/dashboard" className="nav-logo" onClick={() => setOpen(false)}>
          Bridge<span>Up</span>
        </NavLink>

        {/* Desktop */}
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/companies">Companies</Link>
          <Link to="/preparation">Preparation</Link>
          <Link to="/talk">Talk to me</Link>
          <button className="nav-logout" onClick={logout}>Logout</button>
        </div>

        {/* Hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="nav-bar" style={{ transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
          <span className="nav-bar" style={{ opacity: open ? 0 : 1 }} />
          <span className="nav-bar" style={{ transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
        </button>
      </div>

      {open && (
        <div className="nav-mobile">
          <NavLink className="nav-mobile-link" to="/dashboard"   onClick={() => setOpen(false)}>Dashboard</NavLink>
          <NavLink className="nav-mobile-link" to="/companies"   onClick={() => setOpen(false)}>Companies</NavLink>
          <NavLink className="nav-mobile-link" to="/preparation" onClick={() => setOpen(false)}>Preparation</NavLink>
          <NavLink className="nav-mobile-link" to="/talk"        onClick={() => setOpen(false)}>Emotional support</NavLink>
          <button  className="nav-mobile-logout" onClick={logout}>Logout</button>
        </div>
      )}
    </nav>
  );
}

/** NavLink with active class helper */
function Link({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
    >
      {children}
    </NavLink>
  );
}
