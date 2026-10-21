import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { companiesApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './CompaniesPage.css';

export default function CompaniesPage() {
  const { data: companies, loading, error, refetch } = useFetch(() => companiesApi.list(), []);
  const [search, setSearch] = useState('');

  const filtered = companies
    ? companies.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="companies-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">
            {companies ? `${companies.length} companies in BridgeUp` : 'Browse placement companies'}
          </p>
        </div>
      </div>

      <div className="search-bar-wrap">
        <input
          type="search"
          className="search-input"
          placeholder="Search companies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search companies"
        />
      </div>

      {loading && <LoadingSpinner message="Loading companies…" />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="🏢"
          title={search ? 'No matching companies' : 'No companies found'}
          message={search ? `No companies match "${search}".` : 'No companies have been added yet.'}
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="companies-grid">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company }) {
  // Generate a consistent colour accent from the company name
  const accent = nameToColor(company.name);

  return (
    <Link to={`/companies/${company.id}`} className="company-card" aria-label={`View experiences for ${company.name}`}>
      <div className="company-card-initial" style={{ background: accent }}>
        {company.name.charAt(0).toUpperCase()}
      </div>
      <div className="company-card-body">
        <h2 className="company-card-name">{company.name}</h2>
        <p className="company-card-meta">
          Added {new Date(company.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </p>
      </div>
      <span className="company-card-arrow" aria-hidden="true">→</span>
    </Link>
  );
}

/** Deterministic accent colour derived from company name. */
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
