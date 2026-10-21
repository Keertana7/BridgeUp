import { useState } from 'react';
import { companiesApi } from '../api/client';
import { generateQuestions } from '../api/preparation';
import { useFetch } from '../hooks/useFetch';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import './Preparation.css';

const CATEGORIES = ['DSA', 'Core', 'Aptitude', 'Programming', 'Project', 'HR', 'AI/ML', 'Other'];

export default function AskGeneratePage() {
  const { data: companies, loading: companiesLoading, error: companiesError, refetch } =
    useFetch(() => companiesApi.list(), []);
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('');
  const [count, setCount] = useState(5);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!company || !category || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateQuestions({
        company,
        category,
        count: Number(count),
        ...(prompt.trim() ? { prompt: prompt.trim() } : {}),
      });
      setResult(response);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }

  const hasResultContent = result && (
    result.analysis ||
    result.patterns?.length ||
    result.questions?.length ||
    result.historical_question_count !== undefined
  );

  return (
    <div className="page-container prep-page ask-generate-page">
      <header className="prep-header">
        <span className="prep-eyebrow">INTERVIEW PRACTICE</span>
        <h1 className="page-title ph-title">Ask &amp; Generate</h1>
        <p className="page-subtitle ph-sub">
          Explore patterns in BridgeUp’s historical interview questions and generate new practice questions.
        </p>
      </header>

      <section className="prep-generate-section" aria-labelledby="ask-generate-title">
        <div className="prep-generate-intro">
          <h2 id="ask-generate-title">Set up your practice session</h2>
          <p>
            Choose a company and category. You can add a request to guide the analysis or practice set.
          </p>
          <p className="prep-ai-note">
            Generated questions are new practice questions, not verified questions from past interviews.
          </p>
        </div>

        {companiesLoading && <LoadingSpinner message="Loading companies…" />}
        {companiesError && <ErrorMessage error={companiesError} onRetry={refetch} />}

        {!companiesLoading && !companiesError && (
          <>
            {companies?.length ? (
              <div className="prep-generate-content">
                <form className="prep-generate-form" onSubmit={handleSubmit}>
                  <label htmlFor="ask-generate-company">Company</label>
                  <select
                    id="ask-generate-company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Select a company</option>
                    {companies.map((item) => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                  </select>

                  <label htmlFor="ask-generate-category">Interview category</label>
                  <select
                    id="ask-generate-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    required
                    disabled={loading}
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>

                  <label htmlFor="ask-generate-count">Practice question count</label>
                  <input
                    id="ask-generate-count"
                    type="number"
                    min="1"
                    max="15"
                    value={count}
                    onChange={(event) => setCount(event.target.value)}
                    required
                    disabled={loading}
                  />

                  <label htmlFor="ask-generate-prompt">
                    Your request <span>Optional</span>
                  </label>
                  <textarea
                    id="ask-generate-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="For example: Analyze recurring topics, then focus the practice questions on problem-solving."
                    maxLength={3000}
                    rows={4}
                    disabled={loading}
                  />
                  <p className="prep-field-note">
                    You can ask for pattern analysis, practice questions, or both.
                  </p>

                  <button
                    type="submit"
                    className="ask-generate-submit"
                    disabled={loading || !company || !category || Number(count) < 1 || Number(count) > 15}
                  >
                    {loading ? 'Generating…' : 'Generate Questions'}
                  </button>
                </form>

                <div className="prep-generated" aria-live="polite">
                  {loading ? (
                    <div className="prep-state" role="status">Analyzing historical questions and preparing your results…</div>
                  ) : error ? (
                    <ErrorMessage error={error} />
                  ) : hasResultContent ? (
                    <GeneratedResult result={result} />
                  ) : (
                    <EmptyState
                      icon="✦"
                      title="Your results will appear here"
                      message="Choose a company and category, then start a session to see historical patterns and new practice questions."
                    />
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon="🏢"
                title="No companies available"
                message="Add a company with interview experiences before generating practice questions."
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}

function GeneratedResult({ result }) {
  const questions = Array.isArray(result.questions) ? result.questions : [];
  const patterns = Array.isArray(result.patterns) ? result.patterns : [];

  return (
    <div className="ask-generate-result">
      <div className="ask-generate-result-heading">
        <h3>Research &amp; practice results</h3>
        {typeof result.historical_question_count === 'number' && (
          <p>
            Based on {result.historical_question_count} historical question
            {result.historical_question_count === 1 ? '' : 's'} in BridgeUp.
          </p>
        )}
      </div>

      {result.analysis && (
        <section className="ask-generate-result-section">
          <h4>Analysis</h4>
          <p>{result.analysis}</p>
        </section>
      )}

      {patterns.length > 0 && (
        <section className="ask-generate-result-section">
          <h4>Observed patterns</h4>
          <ul>{patterns.map((pattern, index) => <li key={`${index}-${pattern}`}>{pattern}</li>)}</ul>
        </section>
      )}

      <section className="ask-generate-result-section ask-generate-practice">
        <h4>New practice questions</h4>
        <p className="ask-generate-disclaimer">
          These are AI-generated for practice and are not historical interview questions.
        </p>
        {questions.length ? (
          <ol>
            {questions.map((question, index) => <li key={`${index}-${question}`}>{question}</li>)}
          </ol>
        ) : (
          <p className="prep-state">No practice questions were generated for this request. The analysis above may still be useful.</p>
        )}
      </section>
    </div>
  );
}
