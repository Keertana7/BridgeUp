import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  fetchAdvice,
  fetchCompanies,
  fetchQuestions,
  generateQuestions,
} from '../api/preparation';
import './Preparation.css';

const TOPIC_GROUPS = [
  {
    id: 'dsa',
    category: 'DSA',
    icon: '⌘',
    title: 'Data Structures & Algorithms',
    subtitle: 'Build problem-solving confidence with interview questions.',
    topics: [
      ['Arrays', 'Traversal, two pointers, sliding windows and prefix sums.'],
      ['Strings', 'Pattern matching, anagrams, palindromes and parsing.'],
      ['Linked Lists', 'Reversal, cycle detection, merging and pointers.'],
      ['Stacks & Queues', 'Monotonic stacks, queue patterns and applications.'],
      ['Trees & Graphs', 'Traversals, search, shortest paths and connectivity.'],
      ['Dynamic Programming', 'Memoization, tabulation and classic DP patterns.'],
      ['Sorting & Searching', 'Binary search, merge sort and search patterns.'],
    ],
  },
  {
    id: 'core',
    category: 'Core',
    icon: '▤',
    title: 'Core Subjects',
    subtitle: 'Revisit the CS fundamentals interviewers like to explore.',
    topics: [
      ['DBMS', 'Normalization, SQL, transactions, indexing and joins.'],
      ['Operating Systems', 'Processes, threads, scheduling and memory.'],
      ['Computer Networks', 'TCP/IP, HTTP, DNS, routing and network basics.'],
      ['OOP', 'Object-oriented principles, SOLID and design patterns.'],
      ['Software Engineering', 'SDLC, Agile, testing and version control.'],
    ],
  },
  {
    id: 'apt',
    category: 'Aptitude',
    icon: '◉',
    title: 'Aptitude',
    subtitle: 'Practice quantitative, logical and verbal reasoning questions.',
    topics: [
      ['Quantitative Aptitude', 'Numbers, percentages, ratios, time and averages.'],
      ['Logical Reasoning', 'Sequences, syllogisms, arrangements and puzzles.'],
      ['Verbal Ability', 'Comprehension, sentence correction and vocabulary.'],
    ],
  },
];

const ADVICE_TYPES = [
  { id: 'advice', label: 'Advice', description: 'Guidance students found useful.' },
  { id: 'mistake', label: 'Mistakes', description: 'Pitfalls others learned from.' },
  { id: 'preparation', label: 'Preparation tips', description: 'Ways to prepare with intention.' },
  { id: 'remember', label: 'Important points', description: 'Helpful reminders to keep close.' },
];

export default function Preparation() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [adviceType, setAdviceType] = useState('advice');
  const [advice, setAdvice] = useState([]);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [companyError, setCompanyError] = useState('');
  const [company, setCompany] = useState('');
  const [generateCategory, setGenerateCategory] = useState('DSA');
  const [questionCount, setQuestionCount] = useState(5);
  const [generated, setGenerated] = useState([]);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const questionsRef = useRef(null);

  useEffect(() => {
    if (!activeCategory) return undefined;
    const controller = new AbortController();
    setQuestions([]);
    setQuestionError('');
    setQuestionLoading(true);

    fetchQuestions(activeCategory, { signal: controller.signal })
      .then(setQuestions)
      .catch((error) => {
        if (error.name !== 'AbortError') setQuestionError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setQuestionLoading(false);
      });

    return () => controller.abort();
  }, [activeCategory]);

  useEffect(() => {
    const controller = new AbortController();
    setAdvice([]);
    setAdviceError('');
    setAdviceLoading(true);

    fetchAdvice(adviceType, { signal: controller.signal })
      .then(setAdvice)
      .catch((error) => {
        if (error.name !== 'AbortError') setAdviceError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setAdviceLoading(false);
      });

    return () => controller.abort();
  }, [adviceType]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCompanies({ signal: controller.signal })
      .then(setCompanies)
      .catch((error) => {
        if (error.name !== 'AbortError') setCompanyError(error.message);
      });
    return () => controller.abort();
  }, []);

  function showQuestions(category) {
    setActiveCategory(category);
    window.requestAnimationFrame(() => {
      questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!company.trim() || generateLoading) return;
    setGenerateError('');
    setGenerated([]);
    setGenerateLoading(true);
    try {
      const response = await generateQuestions({
        company: company.trim(),
        category: generateCategory,
        count: questionCount,
      });
      setGenerated(response.questions);
    } catch (error) {
      setGenerateError(error.message);
    } finally {
      setGenerateLoading(false);
    }
  }

  const selectedGroup = TOPIC_GROUPS.find((group) => group.category === activeCategory);

  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <div className="page-container prep-page">
          <header className="ph prep-header">
            <button className="btn-ghost prep-back" onClick={() => navigate('/dashboard')}>
              ← Dashboard
            </button>
            <span className="prep-eyebrow">YOUR NEXT STEP, AT YOUR PACE</span>
            <h1 className="ph-title">Prepare with purpose.</h1>
            <p className="ph-sub">
              Practice real interview questions, learn from other students and get a little help when you need it.
            </p>
            <nav className="prep-jump-links" aria-label="Preparation sections">
              <a href="#dsa">DSA</a>
              <a href="#core">Core subjects</a>
              <a href="#apt">Aptitude</a>
              <a href="#insights">Advice & insights</a>
              <a href="#ask-generate">Ask & generate</a>
              <button type="button" onClick={() => navigate('/talk')}>Emotional support</button>
            </nav>
          </header>

          {activeCategory && (
            <section className="prep-question-panel" ref={questionsRef} aria-live="polite">
              <div className="prep-panel-heading">
                <div>
                  <span className="prep-eyebrow">QUESTIONS FROM REAL EXPERIENCES</span>
                  <h2>{selectedGroup?.title || activeCategory} practice</h2>
                </div>
                <button className="prep-text-button" onClick={() => navigate('/talk')}>
                  Need a breather? Talk with us →
                </button>
              </div>
              {questionLoading && <p className="prep-state">Finding questions for you…</p>}
              {questionError && <p className="prep-error" role="alert">{questionError}</p>}
              {!questionLoading && !questionError && questions.length === 0 && (
                <div className="prep-empty">
                  <strong>No questions in this category yet.</strong>
                  <span>Try Ask & Generate for a practice set inspired by a company.</span>
                  <a href="#ask-generate">Create practice questions ↓</a>
                </div>
              )}
              {!questionLoading && !questionError && questions.length > 0 && (
                <ol className="prep-question-list">
                  {questions.map((question, index) => (
                    <li key={question.id || `${question.question}-${index}`}>
                      <span className="prep-question-number">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <div className="prep-question-tags">
                          <span>{question.category}</span>
                          {question.subcategory && <span>{question.subcategory}</span>}
                          {question.difficulty && <span>{question.difficulty}</span>}
                        </div>
                        <p>{question.question}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          {TOPIC_GROUPS.map((group) => (
            <section id={group.id} className="prep-topic-section" key={group.id}>
              <div className="prep-section-heading">
                <span className="prep-section-icon" aria-hidden="true">{group.icon}</span>
                <div>
                  <h2>{group.title}</h2>
                  <p>{group.subtitle}</p>
                </div>
              </div>
              <div className="prep-topic-grid">
                {group.topics.map(([title, description]) => (
                  <article className="prep-topic-card" key={title}>
                    <span className="prep-topic-label">{group.category} · PRACTICE</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <button onClick={() => showQuestions(group.category)}>
                      View interview questions <span aria-hidden="true">→</span>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <section id="insights" className="prep-community-section">
            <div className="prep-section-heading">
              <span className="prep-section-icon" aria-hidden="true">✳</span>
              <div>
                <h2>Advice & insights</h2>
                <p>Notes from students who have been through the process.</p>
              </div>
            </div>
            <div className="prep-advice-tabs" role="tablist" aria-label="Advice type">
              {ADVICE_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={adviceType === item.id}
                  className={adviceType === item.id ? 'selected' : ''}
                  onClick={() => setAdviceType(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="prep-advice-description">
              {ADVICE_TYPES.find((item) => item.id === adviceType)?.description}
            </p>
            {adviceLoading && <p className="prep-state">Gathering community insights…</p>}
            {adviceError && <p className="prep-error" role="alert">{adviceError}</p>}
            {!adviceLoading && !adviceError && advice.length === 0 && (
              <p className="prep-empty">No community notes in this collection yet. Check back as students share their experiences.</p>
            )}
            {!adviceLoading && !adviceError && advice.length > 0 && (
              <div className="prep-advice-list">
                {advice.map((item) => <article key={item.id}>{item.content}</article>)}
              </div>
            )}
          </section>

          <section id="ask-generate" className="prep-generate-section">
            <div className="prep-generate-intro">
              <span className="prep-eyebrow">A PERSONAL PRACTICE SET</span>
              <h2>Ask & generate</h2>
              <p>Choose a company and topic to make fresh practice questions inspired by BridgeUp interview experiences.</p>
              <p className="prep-ai-note">Generated questions are practice prompts, not claims about what was asked in an interview.</p>
            </div>
            <div className="prep-generate-content">
              <form className="prep-generate-form" onSubmit={handleGenerate}>
                <label htmlFor="prep-company">Company</label>
                <input
                  id="prep-company"
                  list="prep-company-options"
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="Choose or enter a company"
                  required
                />
                <datalist id="prep-company-options">
                  {companies.map((item) => <option key={item.id} value={item.name} />)}
                </datalist>
                {companyError && <span className="prep-field-note">{companyError}</span>}
                <label htmlFor="prep-category">Practice area</label>
                <select id="prep-category" value={generateCategory} onChange={(event) => setGenerateCategory(event.target.value)}>
                  <option value="DSA">DSA</option>
                  <option value="Core">Core subjects</option>
                  <option value="Aptitude">Aptitude</option>
                </select>
                <label htmlFor="prep-question-count">
                  Number of questions <span>{questionCount}</span>
                </label>
                <input
                  id="prep-question-count"
                  type="range"
                  min="1"
                  max="15"
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                />
                <button className="btn-primary" type="submit" disabled={generateLoading || !company.trim()}>
                  {generateLoading ? 'Creating your practice set…' : 'Generate practice questions'}
                </button>
                {generateError && <p className="prep-error" role="alert">{generateError}</p>}
              </form>
              <div className="prep-generated" aria-live="polite">
                {generated.length ? (
                  <>
                    <h3>{company} · {generateCategory}</h3>
                    <ol>{generated.map((question, index) => <li key={`${index}-${question}`}>{question}</li>)}</ol>
                  </>
                ) : (
                  <div className="prep-generated-empty">
                    <span aria-hidden="true">✳</span>
                    <strong>Your practice set will appear here.</strong>
                    <p>Pick a company and topic to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="prep-support-banner">
            <div>
              <span className="prep-eyebrow">YOU DON’T HAVE TO FIGURE IT ALL OUT ALONE</span>
              <h2>Need to talk through a tough day?</h2>
              <p>Meet your supportive BridgeUp companion for a kind, judgment-free conversation.</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/talk')}>Open emotional support chat →</button>
          </section>
        </div>
      </main>
    </div>
  );
}
