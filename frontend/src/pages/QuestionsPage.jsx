import { useState, useMemo } from 'react';
import { useFetch } from '../hooks/useFetch';
import { questionsApi, experiencesApi, companiesApi } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './QuestionsPage.css';

// Exact category values from the backend Category enum
const CATEGORIES = ['DSA', 'Core', 'Aptitude', 'Programming', 'Project', 'HR', 'AI/ML', 'Other'];

const CATEGORY_COLORS = {
  DSA: '#4f46e5',
  Core: '#0891b2',
  Aptitude: '#7c3aed',
  Programming: '#059669',
  Project: '#d97706',
  HR: '#9333ea',
  'AI/ML': '#0284c7',
  Other: '#6b7280',
};

export default function QuestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  // Primary data
  const { data: questions, loading: lq, error: eq, refetch } = useFetch(
    () => questionsApi.list(null, selectedCategory || null),
    [selectedCategory]
  );

  // Supporting data — load once to give each question its company context
  const { data: experiences } = useFetch(() => experiencesApi.list(), []);
  const { data: companies } = useFetch(() => companiesApi.list(), []);

  // Build lookup maps so card rendering is O(1)
  const experienceMap = useMemo(() => {
    if (!experiences) return {};
    return Object.fromEntries(experiences.map((e) => [e.id, e]));
  }, [experiences]);

  const companyMap = useMemo(() => {
    if (!companies) return {};
    return Object.fromEntries(companies.map((c) => [c.id, c]));
  }, [companies]);

  const filtered = questions
    ? questions.filter((q) =>
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        (q.subcategory || '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const loading = lq;
  const error = eq;

  return (
    <div className="questions-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interview Questions</h1>
          <p className="page-subtitle">
            {questions ? `${questions.length} questions` : 'Browse questions from all companies'}
            {selectedCategory && ` in ${selectedCategory}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-row">
        <input
          type="search"
          className="search-input"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search questions"
        />
        <div className="category-pills">
          <button
            className={`cat-pill ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              style={{ '--pill-color': CATEGORY_COLORS[cat] }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingSpinner message="Loading questions…" />}
      {error && <ErrorMessage error={error} onRetry={refetch} />}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon="❓"
          title="No questions found"
          message={
            search
              ? `No questions match "${search}".`
              : selectedCategory
              ? `No questions in the ${selectedCategory} category yet.`
              : 'No questions have been recorded yet.'
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="questions-list">
          {filtered.map((q) => {
            const exp = experienceMap[q.experience_id];
            const company = exp ? companyMap[exp.company_id] : null;
            return (
              <QuestionCard
                key={q.id}
                question={q}
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

function QuestionCard({ question: q, companyName, role }) {
  const color = CATEGORY_COLORS[q.category] || '#6b7280';

  return (
    <div className="question-card">
      <div className="question-card-header">
        <span className="question-category-badge" style={{ '--cat-color': color }}>
          {q.category}
        </span>
        {q.subcategory && <span className="question-chip">{q.subcategory}</span>}
        {q.difficulty && <span className="question-chip">{q.difficulty}</span>}
        {q.source_section && (
          <span className="question-chip question-source">{q.source_section}</span>
        )}
      </div>

      <p className="question-card-text">{q.question}</p>

      {(companyName || role) && (
        <div className="question-card-context">
          {companyName && <span className="q-company">{companyName}</span>}
          {role && <span className="q-role">{role}</span>}
        </div>
      )}
    </div>
  );
}
