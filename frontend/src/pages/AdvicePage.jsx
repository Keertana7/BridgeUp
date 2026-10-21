import { useState, useMemo } from 'react';
import { useFetch } from '../hooks/useFetch';
import { adviceApi, experiencesApi, companiesApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './AdvicePage.css';

// Exact AdviceType enum values from the backend
const ADVICE_TYPES = ['advice', 'mistake', 'remember', 'preparation'];

const TYPE_CONFIG = {
  advice: {
    icon: '💡',
    label: 'Advice',
    bg: '#fefce8',
    border: '#fde047',
    color: '#854d0e',
    badgeBg: '#fef9c3',
  },
  mistake: {
    icon: '⚠️',
    label: 'Mistake',
    bg: '#fef2f2',
    border: '#fca5a5',
    color: '#991b1b',
    badgeBg: '#fee2e2',
  },
  remember: {
    icon: '📌',
    label: 'Remember',
    bg: '#f0f9ff',
    border: '#7dd3fc',
    color: '#0369a1',
    badgeBg: '#e0f2fe',
  },
  preparation: {
    icon: '📖',
    label: 'Preparation',
    bg: '#f0fdf4',
    border: '#86efac',
    color: '#15803d',
    badgeBg: '#dcfce7',
  },
};

export default function AdvicePage() {
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');

  // Primary data
  const { data: adviceItems, loading, error, refetch } = useFetch(
    () => adviceApi.list(null, selectedType || null),
    [selectedType]
  );

  // Supporting data — load once for company/role context on each card
  const { data: experiences } = useFetch(() => experiencesApi.list(), []);
  const { data: companies } = useFetch(() => companiesApi.list(), []);

  // Build lookup maps
  const experienceMap = useMemo(() => {
    if (!experiences) return {};
    return Object.fromEntries(experiences.map((e) => [e.id, e]));
  }, [experiences]);

  const companyMap = useMemo(() => {
    if (!companies) return {};
    return Object.fromEntries(companies.map((c) => [c.id, c]));
  }, [companies]);

  const filtered = adviceItems
    ? adviceItems.filter((a) =>
        a.content.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="advice-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Advice &amp; Tips</h1>
          <p className="page-subtitle">
            {adviceItems ? `${adviceItems.length} entries` : 'Learn from seniors'}
            {selectedType && ` · ${TYPE_CONFIG[selectedType]?.label}`}
          </p>
        </div>
      </div>

      <div className="filters-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search advice…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search advice"
        />

        <div className="type-pills">
          <button
            className={`type-pill ${selectedType === '' ? 'active' : ''}`}
            onClick={() => setSelectedType('')}
          >
            All
          </button>
          {ADVICE_TYPES.map((type) => {
            const cfg = TYPE_CONFIG[type];
            return (
              <button
                key={type}
                className={`type-pill ${selectedType === type ? 'active' : ''}`}
                style={{
                  '--type-color': cfg.color,
                  '--type-bg': cfg.badgeBg,
                  '--type-border': cfg.border,
                }}
                onClick={() => setSelectedType(type)}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading advice…" />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="💡"
          title="No advice found"
          message={
            search
              ? `Nothing matches "${search}".`
              : selectedType
              ? `No ${TYPE_CONFIG[selectedType]?.label.toLowerCase()} entries yet.`
              : 'No advice has been recorded yet.'
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="advice-list">
          {filtered.map((item) => {
            const exp = experienceMap[item.experience_id];
            const company = exp ? companyMap[exp.company_id] : null;
            return (
              <AdviceCard
                key={item.id}
                advice={item}
                companyName={company?.name || null}
                role={exp?.role || null}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdviceCard({ advice: a, companyName, role }) {
  const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.advice;

  return (
    <div
      className="advice-card"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className="advice-card-label" style={{ color: cfg.color }}>
        {cfg.icon} {cfg.label}
      </div>
      <p className="advice-card-content">{a.content}</p>

      {(companyName || role) && (
        <div className="advice-card-context">
          {companyName && <span className="a-company">{companyName}</span>}
          {role && <span className="a-role">{role}</span>}
        </div>
      )}
    </div>
  );
}
