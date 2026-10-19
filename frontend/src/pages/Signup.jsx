import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, supabaseConfigured } from '../lib/supabase';

export default function Signup() {
  const navigate = useNavigate();
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!supabaseConfigured || !supabase) { setError('Supabase is not configured. Create frontend/.env first.'); return; }
    if (!name.trim())        return setError('Please enter your full name.');
    if (!email.trim())       return setError('Please enter your email address.');
    if (pw.length < 6)       return setError('Password must be at least 6 characters.');
    if (pw !== confirm)      return setError('Passwords do not match.');

    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(), password: pw,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);
    if (err) { setError(err.message || 'Signup failed. Please try again.'); return; }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="auth-wrap">
        <div className="auth-panel">
          <div className="auth-panel-logo">Bridge<span>Up</span></div>
          <h2>You&apos;re almost there!</h2>
          <p>Check your email for a confirmation link to activate your account.</p>
        </div>
        <div className="auth-form-side">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="auth-brand" style={{ textAlign: 'left' }}>Bridge<span>Up</span></div>
            <div style={{ fontSize: '3rem', margin: '1rem 0' }}>📧</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '.5rem' }}>Check your inbox</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.93rem', marginBottom: '1.5rem' }}>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
            </p>
            <div className="alert alert-success">Account created successfully!</div>
            <Link to="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '.5rem' }}>
              Go to Login →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-panel">
        <div className="auth-panel-logo">Bridge<span>Up</span></div>
        <h2>Create your BridgeUp account</h2>
        <p>Join thousands of students preparing for placements with real interview experiences.</p>
        <div className="auth-panel-pills">
          <div className="auth-pill"><span className="auth-pill-icon">✅</span> Free for all students</div>
          <div className="auth-pill"><span className="auth-pill-icon">📖</span> Real student experiences</div>
          <div className="auth-pill"><span className="auth-pill-icon">🎯</span> Company-wise interview prep</div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-brand">Bridge<span>Up</span></div>
          <h1 className="auth-heading">Create your account</h1>
          <p className="auth-sub">Start preparing smarter for placements.</p>

          {!supabaseConfigured && (
            <div className="alert alert-error" style={{ fontSize: '.84rem' }}>
              <strong>Setup required:</strong> Create <code>frontend/.env</code> before signing up.
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" className="form-input"
                placeholder="Your full name" value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name" disabled={loading} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" className="form-input"
                placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email" disabled={loading} />
            </div>
            <div className="form-group">
              <label htmlFor="pw">Password</label>
              <input id="pw" type="password" className="form-input"
                placeholder="At least 6 characters" value={pw}
                onChange={e => setPw(e.target.value)}
                autoComplete="new-password" disabled={loading} />
            </div>
            <div className="form-group">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password"
                className={`form-input${pw && confirm && pw !== confirm ? ' error' : ''}`}
                placeholder="Repeat your password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password" disabled={loading} />
              {pw && confirm && pw !== confirm && (
                <span style={{ fontSize: '.8rem', color: 'var(--err)' }}>Passwords do not match</span>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', padding: '.72rem', fontSize: '1rem', marginTop: '.4rem' }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
