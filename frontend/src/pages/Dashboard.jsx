import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const name = session?.user?.user_metadata?.full_name
    || session?.user?.email?.split('@')[0] || 'there';

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="page-container">

          {/* ── Hero ───────────────────────────────────── */}
          <section className="dash-hero">
            <div className="dash-hero-text">
              <span className="dash-tag">Placement Preparation Platform</span>
              <h1 className="dash-h1">
                Your placement<br />preparation <span>starts here.</span>
              </h1>
              <p className="dash-desc">
                Learn from real interview experiences shared by students who've been
                placed at top companies. Prepare smarter and walk into your interview ready.
              </p>
              <div className="dash-btns">
                <button className="btn-primary" onClick={() => navigate('/companies')}
                  style={{ padding: '.75rem 1.6rem', fontSize: '.97rem' }}>
                  Browse Companies →
                </button>
                <button className="btn-outline" onClick={() => navigate('/preparation')}
                  style={{ padding: '.72rem 1.4rem', fontSize: '.97rem' }}>
                  Start Preparing
                </button>
              </div>
            </div>

            <div className="card card-lift dash-stat-card"
              onClick={() => navigate('/companies')}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate('/companies')}>
              <div className="dash-stat-icon-wrap">🏢</div>
              <div className="dash-stat-label">Companies</div>
              <div className="dash-stat-num">15+</div>
              <div className="dash-stat-desc">Student experiences from top campus recruiters</div>
              <div className="dash-stat-link">Explore all →</div>
            </div>
          </section>

          <hr className="divider" />

          {/* ── Get started ─────────────────────────────── */}
          <section className="dash-section">
            <h2 className="dash-section-title">Get started</h2>
            <div className="grid grid-3">
              <ActionCard
                iconBg="#EEE9FF" icon="🏢" iconColor="#7C5CFC"
                title="Companies"
                desc="Browse companies and read student-shared placement experiences."
                link="View companies →"
                onClick={() => navigate('/companies')}
              />
              <ActionCard
                iconBg="#E8F1FF" icon="📚" iconColor="#5B8DEF"
                title="Preparation"
                desc="Practice DSA, Core Subjects and Aptitude topics commonly tested in placement rounds."
                link="Start preparing →"
                onClick={() => navigate('/preparation')}
              />
              <ActionCard
                iconBg="#FDE8F0" icon="🗒️" iconColor="#F48FB1"
                title="Student Stories"
                desc="Personal placement journeys — real preparation strategies, struggles, and lessons."
                link="Read stories →"
                onClick={() => navigate('/student-stories')}
              />
            </div>
          </section>

          {/* ── Why BridgeUp ─────────────────────────────── */}
          <section style={{ marginBottom: '1rem' }}>
            <h2 className="dash-section-title">Why BridgeUp?</h2>
            <div className="dash-pill-row">
              {['✅ Real student experiences', '🎯 Company-wise interview prep',
                '📊 DSA, CS fundamentals & aptitude', '🔓 Free for all students'].map(t => (
                <div key={t} className="dash-pill">{t}</div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

function ActionCard({ iconBg, icon, iconColor, title, desc, link, onClick }) {
  return (
    <div className="card card-lift dash-action-card"
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="dash-action-icon" style={{ background: iconBg }}>{icon}</div>
      <h3 className="dash-action-title">{title}</h3>
      <p className="dash-action-desc">{desc}</p>
      <span className="dash-action-link" style={{ color: iconColor }}>{link}</span>
    </div>
  );
}

