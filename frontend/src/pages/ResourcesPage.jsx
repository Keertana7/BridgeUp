import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { resourcesApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './ResourcesPage.css';

export default function ResourcesPage() {
  const { data: resources, loading, error, refetch } = useFetch(() => resourcesApi.list(), []);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Derive unique categories from the data
  const categories = resources
    ? [...new Set(resources.map((r) => r.category).filter(Boolean))]
    : [];

  const filtered = resources
    ? resources.filter((r) => {
        const matchesSearch =
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !selectedCategory || r.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
    : [];

  return (
    <div className="resources-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">
            {resources ? `${resources.length} resources available` : 'Study materials and links'}
          </p>
        </div>
      </div>

      <div className="filters-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search resources…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search resources"
        />

        {categories.length > 0 && (
          <div className="category-pills">
            <button
              className={`cat-pill ${selectedCategory === '' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <LoadingSpinner message="Loading resources…" />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="📚"
          title="No resources found"
          message={
            search || selectedCategory
              ? 'No resources match your filters.'
              : 'No resources have been added yet.'
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="resources-grid">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource: r }) {
  const isLink = !!r.url;

  const inner = (
    <div className="resource-card-inner">
      <div className="resource-card-header">
        <span className="resource-type-icon">{resourceTypeIcon(r.resource_type)}</span>
        <div className="resource-card-meta">
          {r.category && <span className="resource-category">{r.category}</span>}
          {r.resource_type && <span className="resource-type">{r.resource_type}</span>}
        </div>
      </div>

      <h2 className="resource-card-title">{r.title}</h2>

      {r.description && (
        <p className="resource-card-desc">{r.description}</p>
      )}

      <div className="resource-card-footer">
        <span className="resource-added">
          {new Date(r.created_at).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </span>
        {isLink && <span className="resource-link-label">Open →</span>}
      </div>
    </div>
  );

  if (isLink) {
    return (
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        className="resource-card"
        aria-label={`Open ${r.title}`}
      >
        {inner}
      </a>
    );
  }

  return <div className="resource-card resource-card--no-link">{inner}</div>;
}

function resourceTypeIcon(type) {
  if (!type) return '📄';
  const t = type.toLowerCase();
  if (t.includes('video') || t.includes('youtube')) return '🎥';
  if (t.includes('book') || t.includes('pdf')) return '📖';
  if (t.includes('article') || t.includes('blog')) return '📝';
  if (t.includes('course') || t.includes('tutorial')) return '🎓';
  if (t.includes('repo') || t.includes('github') || t.includes('code')) return '💻';
  if (t.includes('sheet') || t.includes('cheat')) return '📋';
  return '📄';
}
