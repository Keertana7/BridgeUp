import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!supabaseConfigured || !supabase) {
      setError('Supabase is not configured. Create frontend/.env from the .env.example file.');
      return;
    }
    if (!email.trim()) return setError('Please enter your email address.');
    if (!password)     return setError('Please enter your password.');

    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) { setError(err.message || 'Login failed. Please check your credentials.'); return; }
    navigate('/dashboard');
  }

  return (
    <div className="auth-wrap">
      {/* Left decorative panel */}
      <div className="auth-panel">
        <div className="auth-panel-logo">Bridge<span>Up</span></div>
        <h2>Your journey to placement success starts here.</h2>
        <p>
          Learn from real interview experiences shared by students who have
          been placed at top companies. Prepare smarter, not harder.
        </p>
        <div className="auth-panel-pills">
          <div className="auth-pill"><span className="auth-pill-icon">🏢</span> Company-wise interview experiences</div>
          <div className="auth-pill"><span className="auth-pill-icon">📚</span> DSA, Core Subjects &amp; Aptitude prep</div>
          <div className="auth-pill"><span className="auth-pill-icon">🎯</span> Student-shared placement stories</div>
        </div>
      </div>

      {/* Right form side */}
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-brand">Bridge<span>Up</span></div>
          <h1 className="auth-heading">Welcome back 👋</h1>
          <p className="auth-sub">Sign in to continue your preparation.</p>

          {!supabaseConfigured && (
            <div className="alert alert-error" style={{ fontSize: '.84rem' }}>
              <strong>Setup required:</strong> Create <code>frontend/.env</code> and fill in{' '}
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then restart.
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" className="form-input"
                placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email" disabled={loading} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className="form-input"
                placeholder="Your password" value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password" disabled={loading} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', padding: '.72rem', fontSize: '1rem', marginTop: '.4rem' }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
