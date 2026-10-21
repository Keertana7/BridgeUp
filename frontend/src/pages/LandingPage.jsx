import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();

  // Already logged in → skip landing
  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-logo">🌉</div>
          <h1 className="landing-headline">
            Bridge the gap between<br />
            <span className="landing-accent">college and career</span>
          </h1>
          <p className="landing-description">
            BridgeUp is a placement preparation platform built by students, for students.
            Access real interview experiences, curated questions, and genuine advice
            from people who&apos;ve been through the same placements.
          </p>
          <div className="landing-ctas">
            <Link to="/signup" className="cta-btn cta-btn--primary">Get started — it&apos;s free</Link>
            <Link to="/login" className="cta-btn cta-btn--outline">Sign in</Link>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <Feature icon="🏢" title="Company Experiences" desc="Real interview experiences shared by seniors at companies in your placement season." />
        <Feature icon="❓" title="Interview Questions" desc="Actual questions asked across companies, organised by category and difficulty." />
        <Feature icon="💡" title="Advice from Seniors" desc="Honest advice, common mistakes, and preparation tips from people who got the offer." />
        <Feature icon="📚" title="Study Resources" desc="Curated links and materials to help you prepare effectively." />
        <Feature icon="💬" title="Talk to Me" desc="Chat with a supportive AI that helps you manage anxiety and stay focused." />
        <Feature icon="📄" title="Share Your Story" desc="Upload your own interview experience as a PDF and help future students." />
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <span className="feature-icon">{icon}</span>
      <h2 className="feature-title">{title}</h2>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}
