import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { companiesApi, experiencesApi, questionsApi, adviceApi, resourcesApi } from '../api/client';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: companies, loading: lc, error: ec } = useFetch(() => companiesApi.list(), []);
  const { data: experiences, loading: le, error: ee } = useFetch(() => experiencesApi.list(), []);
  const { data: questions, loading: lq, error: eq } = useFetch(() => questionsApi.list(), []);
  const { data: advice, loading: la, error: ea } = useFetch(() => adviceApi.list(), []);
  const { data: resources, loading: lr, error: er } = useFetch(() => resourcesApi.list(), []);

  const greeting = getGreeting();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">{greeting}, {user?.email?.split('@')[0] || 'there'} 👋</h1>
          <p className="dashboard-sub">Here&apos;s what&apos;s available on BridgeUp today.</p>
        </div>
        <Link to="/companies" className="dashboard-cta-btn">Browse Companies →</Link>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatCard
          title="Companies"
          count={companies?.length}
          loading={lc}
          error={ec}
          icon="🏢"
          to="/companies"
          color="#4f46e5"
        />
        <StatCard
          title="Experiences"
          count={experiences?.length}
          loading={le}
          error={ee}
          icon="📋"
          to="/companies"
          color="#0891b2"
        />
        <StatCard
          title="Questions"
          count={questions?.length}
          loading={lq}
          error={eq}
          icon="❓"
          to="/questions"
          color="#7c3aed"
        />
        <StatCard
          title="Advice"
          count={advice?.length}
          loading={la}
          error={ea}
          icon="💡"
          to="/advice"
          color="#d97706"
        />
        <StatCard
          title="Resources"
          count={resources?.length}
          loading={lr}
          error={er}
          icon="📚"
          to="/resources"
          color="#059669"
        />
      </div>

      {/* Quick links */}
      <div className="quick-section">
        <h2 className="section-title">Quick access</h2>
        <div className="quick-grid">
          <QuickCard
            to="/companies"
            icon="🏢"
            title="Companies"
            desc="Browse all companies and their placement experiences."
          />
          <QuickCard
            to="/questions"
            icon="❓"
            title="Interview Questions"
            desc="Explore questions asked across all companies."
          />
          <QuickCard
            to="/advice"
            icon="💡"
            title="Advice & Tips"
            desc="Learn from mistakes and preparation tips from seniors."
          />
          <QuickCard
            to="/resources"
            icon="📚"
            title="Resources"
            desc="Curated study materials and links."
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, count, loading, error, icon, to, color }) {
  return (
    <Link to={to} className="stat-card" style={{ '--accent': color }}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        {loading ? (
          <span className="stat-count stat-loading">—</span>
        ) : error ? (
          <span className="stat-count stat-error">!</span>
        ) : (
          <span className="stat-count">{count ?? 0}</span>
        )}
      </div>
    </Link>
  );
}

function QuickCard({ to, icon, title, desc }) {
  return (
    <Link to={to} className="quick-card">
      <span className="quick-icon">{icon}</span>
      <div>
        <p className="quick-title">{title}</p>
        <p className="quick-desc">{desc}</p>
      </div>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
