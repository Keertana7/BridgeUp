import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { companiesApi, experiencesApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './CompanyDetailPage.css';

export default function CompanyDetailPage() {
  const { companyId } = useParams();

  const {
    data: company,
    loading: lc,
    error: ec,
    refetch: refetchCompany,
  } = useFetch(() => companiesApi.get(companyId), [companyId]);

  const {
    data: experiences,
    loading: le,
    error: ee,
    refetch: refetchExp,
  } = useFetch(() => experiencesApi.list(companyId), [companyId]);

  if (lc) return <LoadingSpinner message="Loading company…" />;
  if (ec) {
    return (
      <div className="company-detail-page">
        <Link to="/companies" className="back-link">← Back to Companies</Link>
        <ErrorMessage error={ec} onRetry={refetchCompany} />
      </div>
    );
  }

  return (
    <div className="company-detail-page">
      <Link to="/companies" className="back-link">← Back to Companies</Link>

      {company && (
        <div className="company-hero">
          <div className="company-hero-initial" style={{ background: nameToColor(company.name) }}>
            {company.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="company-hero-name">{company.name}</h1>
            <p className="company-hero-meta">
              Added on {new Date(company.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}

      <div className="experiences-section">
        <h2 className="section-title">
          Interview Experiences
          {experiences && (
            <span className="experience-count">{experiences.length}</span>
          )}
        </h2>

        {le && <LoadingSpinner message="Loading experiences…" />}
        {ee && <ErrorMessage error={ee} onRetry={refetchExp} />}

        {!le && !ee && experiences?.length === 0 && (
          <EmptyState
            icon="📋"
            title="No experiences yet"
            message="No interview experiences have been shared for this company yet."
          />
        )}

        {!le && !ee && experiences?.length > 0 && (
          <div className="experiences-list">
            {experiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExperienceCard({ experience: exp }) {
  const statusColor = {
    Selected: '#059669',
    Rejected: '#dc2626',
    'On Hold': '#d97706',
  }[exp.selection_status] || '#6b7280';

  return (
    <Link to={`/experiences/${exp.id}`} className="experience-card">
      <div className="experience-card-header">
        <div className="experience-card-role">
          {exp.role || <span className="field-missing">Role not specified</span>}
        </div>
        {exp.selection_status && (
          <span
            className="experience-badge"
            style={{ '--badge-color': statusColor }}
          >
            {exp.selection_status}
          </span>
        )}
      </div>

      <div className="experience-card-meta">
        {exp.batch && <MetaChip icon="🎓" label={exp.batch} />}
        {exp.opportunity_type && <MetaChip icon="💼" label={exp.opportunity_type} />}
        {exp.package && <MetaChip icon="💰" label={exp.package} />}
        {exp.difficulty && <MetaChip icon="📊" label={exp.difficulty} />}
        {exp.interview_date && (
          <MetaChip
            icon="📅"
            label={new Date(exp.interview_date).toLocaleDateString('en-IN', {
              month: 'short', year: 'numeric',
            })}
          />
        )}
        {exp.preparation_duration && <MetaChip icon="⏱" label={exp.preparation_duration} />}
      </div>

      <div className="experience-card-footer">
        <span className="experience-source">
          {exp.source_type === 'pdf' ? '📄 PDF upload' : '📝 Form submission'}
        </span>
        <span className="experience-cta">View details →</span>
      </div>
    </Link>
  );
}

function MetaChip({ icon, label }) {
  return (
    <span className="meta-chip">
      {icon} {label}
    </span>
  );
}

function nameToColor(name) {
  const palette = [
    '#4f46e5', '#0891b2', '#7c3aed', '#d97706',
    '#059669', '#dc2626', '#9333ea', '#0284c7',
    '#ca8a04', '#16a34a',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
