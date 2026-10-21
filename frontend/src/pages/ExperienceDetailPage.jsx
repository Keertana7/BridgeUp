import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { experiencesApi, companiesApi, questionsApi, adviceApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './ExperienceDetailPage.css';

export default function ExperienceDetailPage() {
  const { experienceId } = useParams();

  const {
    data: experience,
    loading: le,
    error: ee,
    refetch: refetchExp,
  } = useFetch(() => experiencesApi.get(experienceId), [experienceId]);

  const {
    data: questions,
    loading: lq,
    error: eq,
  } = useFetch(() => questionsApi.list(experienceId), [experienceId]);

  const {
    data: advice,
    loading: la,
    error: ea,
  } = useFetch(() => adviceApi.list(experienceId), [experienceId]);

  // Fetch company info — only fires when experience.company_id is available
  const {
    data: company,
    loading: lc,
  } = useFetch(
    () => experience?.company_id
      ? companiesApi.get(experience.company_id)
      : Promise.resolve(null),
    [experience?.company_id ?? null]
  );

  if (le) return <LoadingSpinner message="Loading experience…" />;
  if (ee) {
    return (
      <div className="exp-detail-page">
        <Link to="/companies" className="back-link">← Back to Companies</Link>
        <ErrorMessage error={ee} onRetry={refetchExp} />
      </div>
    );
  }

  if (!experience) return null;

  const backUrl = experience.company_id ? `/companies/${experience.company_id}` : '/companies';

  return (
    <div className="exp-detail-page">
      <Link to={backUrl} className="back-link">
        ← Back to {lc ? '…' : (company?.name || 'Company')}
      </Link>

      {/* ── Hero ── */}
      <div className="exp-hero">
        <div className="exp-hero-left">
          <h1 className="exp-hero-role">
            {experience.role || <span className="field-missing">Role not specified</span>}
          </h1>
          <div className="exp-hero-company">
            {lc ? '…' : (company?.name && (
              <Link to={backUrl} className="company-link">{company.name}</Link>
            ))}
          </div>
        </div>
        {experience.selection_status && (
          <StatusBadge status={experience.selection_status} />
        )}
      </div>

      {/* ── Key facts ── */}
      <div className="exp-facts-grid">
        <Fact label="Batch" value={experience.batch} />
        <Fact label="Package" value={experience.package} />
        <Fact label="Opportunity" value={experience.opportunity_type} />
        <Fact label="Difficulty" value={experience.difficulty} />
        <Fact label="Preparation" value={experience.preparation_duration} />
        <Fact
          label="Interview date"
          value={
            experience.interview_date
              ? new Date(experience.interview_date).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : null
          }
        />
        <Fact
          label="Source"
          value={experience.source_type === 'pdf' ? '📄 PDF upload' : experience.source_type === 'form' ? '📝 Form submission' : experience.source_type}
        />
        <Fact
          label="Added on"
          value={new Date(experience.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        />
      </div>

      {/* ── Raw content (the actual interview narrative) ── */}
      {experience.content != null &&
        (typeof experience.content === 'string'
          ? experience.content.trim().length > 0
          : typeof experience.content === 'object'
            ? Object.keys(experience.content).length > 0
            : true) && (
        <section className="exp-section">
          <h2 className="exp-section-title">Experience Content</h2>
          <ContentBlock content={experience.content} />
        </section>
      )}

      {/* ── Questions ── */}
      <section className="exp-section">
        <h2 className="exp-section-title">
          Interview Questions
          {questions && <span className="count-badge">{questions.length}</span>}
        </h2>

        {lq && <LoadingSpinner message="Loading questions…" />}
        {eq && <ErrorMessage error={eq} />}

        {!lq && !eq && questions?.length === 0 && (
          <EmptyState icon="❓" title="No questions recorded" message="No questions have been logged for this experience." />
        )}

        {!lq && !eq && questions?.length > 0 && (
          <div className="questions-list">
            {questions.map((q) => (
              <QuestionItem key={q.id} question={q} />
            ))}
          </div>
        )}
      </section>

      {/* ── Advice ── */}
      <section className="exp-section">
        <h2 className="exp-section-title">
          Advice &amp; Tips
          {advice && <span className="count-badge">{advice.length}</span>}
        </h2>

        {la && <LoadingSpinner message="Loading advice…" />}
        {ea && <ErrorMessage error={ea} />}

        {!la && !ea && advice?.length === 0 && (
          <EmptyState icon="💡" title="No advice recorded" message="No advice has been logged for this experience." />
        )}

        {!la && !ea && advice?.length > 0 && (
          <div className="advice-list">
            {advice.map((a) => (
              <AdviceItem key={a.id} advice={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Fact({ label, value }) {
  if (!value) return null;
  return (
    <div className="fact-item">
      <span className="fact-label">{label}</span>
      <span className="fact-value">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Selected: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    Rejected: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
    'On Hold': { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  };
  const style = map[status] || { bg: '#f9fafb', color: '#374151', border: '#e5e7eb' };
  return (
    <div
      className="status-badge"
      style={{ background: style.bg, color: style.color, borderColor: style.border }}
    >
      {status}
    </div>
  );
}

/**
 * Renders the `content` JSON object returned by the backend.
 * The schema is not fixed — we render whatever keys exist.
 */
function ContentBlock({ content }) {
  if (typeof content === 'string') {
    return <p className="content-text">{content}</p>;
  }

  if (Array.isArray(content)) {
    return (
      <ul className="content-list">
        {content.map((item, i) => (
          <li key={i}>{typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof content === 'object' && content !== null) {
    return (
      <div className="content-object">
        {Object.entries(content).map(([key, val]) => (
          <div key={key} className="content-entry">
            <dt className="content-key">{formatKey(key)}</dt>
            <dd className="content-val">
              {typeof val === 'string'
                ? <p>{val}</p>
                : Array.isArray(val)
                  ? (
                    <ul className="content-list">
                      {val.map((v, i) => <li key={i}>{typeof v === 'string' ? v : JSON.stringify(v)}</li>)}
                    </ul>
                  )
                  : <pre className="content-raw">{JSON.stringify(val, null, 2)}</pre>
              }
            </dd>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="content-raw">{JSON.stringify(content, null, 2)}</pre>;
}

function QuestionItem({ question: q }) {
  const categoryColors = {
    DSA: '#4f46e5',
    Core: '#0891b2',
    Aptitude: '#7c3aed',
    Programming: '#059669',
    Project: '#d97706',
    HR: '#9333ea',
    'AI/ML': '#0284c7',
    Other: '#6b7280',
  };
  const color = categoryColors[q.category] || '#6b7280';

  return (
    <div className="question-item">
      <div className="question-item-header">
        <span className="question-category" style={{ '--cat-color': color }}>
          {q.category}
        </span>
        {q.subcategory && <span className="question-sub">{q.subcategory}</span>}
        {q.difficulty && <span className="question-diff">{q.difficulty}</span>}
        {q.source_section && <span className="question-source">{q.source_section}</span>}
      </div>
      <p className="question-text">{q.question}</p>
    </div>
  );
}

const adviceTypeConfig = {
  advice:      { icon: '💡', label: 'Advice',      bg: '#fefce8', border: '#fde047', color: '#854d0e' },
  mistake:     { icon: '⚠️', label: 'Mistake',     bg: '#fef2f2', border: '#fca5a5', color: '#991b1b' },
  remember:    { icon: '📌', label: 'Remember',    bg: '#f0f9ff', border: '#7dd3fc', color: '#0369a1' },
  preparation: { icon: '📖', label: 'Preparation', bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
};

function AdviceItem({ advice: a }) {
  const cfg = adviceTypeConfig[a.type] || adviceTypeConfig.advice;
  return (
    <div
      className="advice-item"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="advice-item-label" style={{ color: cfg.color }}>
        {cfg.icon} {cfg.label}
      </div>
      <p className="advice-item-content">{a.content}</p>
    </div>
  );
}

function formatKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
