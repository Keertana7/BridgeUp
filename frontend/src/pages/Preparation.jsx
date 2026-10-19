import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const DSA_TOPICS = [
  {
    id: 'arrays',
    icon: '🔢',
    title: 'Arrays',
    description: 'Traversal, two-pointer, sliding window, prefix sums, and common manipulation problems.',
    questions: 42,
  },
  {
    id: 'strings',
    icon: '🔤',
    title: 'Strings',
    description: 'Pattern matching, anagrams, palindromes, and string manipulation techniques.',
    questions: 35,
  },
  {
    id: 'linked-lists',
    icon: '🔗',
    title: 'Linked Lists',
    description: 'Reversal, cycle detection, merging, and pointer manipulation problems.',
    questions: 28,
  },
  {
    id: 'stacks-queues',
    icon: '📦',
    title: 'Stacks & Queues',
    description: 'Monotonic stacks, queue implementations, and real-world application problems.',
    questions: 24,
  },
  {
    id: 'trees',
    icon: '🌳',
    title: 'Trees',
    description: 'Binary trees, BSTs, traversals, height, LCA, and tree DP problems.',
    questions: 38,
  },
  {
    id: 'graphs',
    icon: '🕸️',
    title: 'Graphs',
    description: 'BFS, DFS, shortest paths, cycle detection, topological sort, and connected components.',
    questions: 32,
  },
  {
    id: 'dynamic-programming',
    icon: '⚡',
    title: 'Dynamic Programming',
    description: 'Memoization, tabulation, classic DP problems — knapsack, LCS, LIS, and matrix DP.',
    questions: 45,
  },
  {
    id: 'sorting-searching',
    icon: '🔍',
    title: 'Sorting & Searching',
    description: 'Binary search patterns, merge sort, quicksort, and search in rotated arrays.',
    questions: 22,
  },
];

const CORE_SUBJECTS = [
  {
    id: 'dbms',
    icon: '🗄️',
    title: 'DBMS',
    description: 'Normalization, SQL queries, transactions, ACID properties, indexing, and joins.',
    questions: 40,
  },
  {
    id: 'os',
    icon: '💻',
    title: 'Operating Systems',
    description: 'Processes, threads, scheduling, memory management, deadlocks, and paging.',
    questions: 38,
  },
  {
    id: 'cn',
    icon: '🌐',
    title: 'Computer Networks',
    description: 'OSI model, TCP/IP, HTTP, DNS, routing protocols, and network security basics.',
    questions: 35,
  },
  {
    id: 'oop',
    icon: '🧩',
    title: 'OOP',
    description: 'Encapsulation, inheritance, polymorphism, abstraction, SOLID principles, and design patterns.',
    questions: 30,
  },
  {
    id: 'se',
    icon: '🛠️',
    title: 'Software Engineering',
    description: 'SDLC models, Agile, testing types, version control concepts, and system design basics.',
    questions: 25,
  },
];

const APTITUDE_TOPICS = [
  {
    id: 'quant',
    icon: '🔣',
    title: 'Quantitative Aptitude',
    description: 'Numbers, percentages, ratios, time & work, time & distance, profit & loss, and averages.',
    questions: 60,
  },
  {
    id: 'logical',
    icon: '🧠',
    title: 'Logical Reasoning',
    description: 'Series, syllogisms, blood relations, seating arrangements, direction sense, and puzzles.',
    questions: 50,
  },
  {
    id: 'verbal',
    icon: '📖',
    title: 'Verbal Ability',
    description: 'Reading comprehension, sentence correction, vocabulary, fill in the blanks, and grammar.',
    questions: 45,
  },
];

// ---------------------------------------------------------------------------
// Topic card component — reused for all three sections
// ---------------------------------------------------------------------------

function TopicCard({ topic, buttonLabel }) {
  return (
    <div className="card" style={cardStyles.card}>
      <div style={cardStyles.top}>
        <span style={cardStyles.icon}>{topic.icon}</span>
        <div style={cardStyles.meta}>
          <span style={cardStyles.questionCount}>{topic.questions} questions</span>
        </div>
      </div>
      <h3 style={cardStyles.title}>{topic.title}</h3>
      <p style={cardStyles.desc}>{topic.description}</p>
      <button
        className="btn-primary"
        style={cardStyles.btn}
        onClick={() => {
          // Placeholder — will connect to question pages when backend is ready
          alert(`${topic.title} — coming soon!`);
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

const cardStyles = {
  card:          { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: '#FFFFFF' },
  top:           { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' },
  icon:          { fontSize: '1.85rem' },
  meta:          { display: 'flex', alignItems: 'center' },
  questionCount: { fontSize: '0.79rem', color: '#5B8DEF', background: '#E8F1FF', padding: '0.22rem 0.65rem', borderRadius: '12px', fontWeight: 700, border: '1px solid #BDD4F8' },
  title:         { fontSize: '1rem', fontWeight: 700, color: '#24213A' },
  desc:          { fontSize: '0.88rem', color: '#857FA8', lineHeight: 1.65, flex: 1 },
  btn:           { marginTop: '0.5rem', padding: '0.55rem 1rem', fontSize: '0.88rem', width: '100%', textAlign: 'center' },
};

// ---------------------------------------------------------------------------
// Section wrapper — heading + grid of cards
// ---------------------------------------------------------------------------

function PrepSection({ id, icon, title, subtitle, topics, buttonLabel }) {
  return (
    <section id={id} style={sectionStyles.section}>
      <div style={sectionStyles.header}>
        <div style={sectionStyles.headerLeft}>
          <span style={sectionStyles.sectionIcon}>{icon}</span>
          <div>
            <h2 style={sectionStyles.sectionTitle}>{title}</h2>
            <p style={sectionStyles.sectionSub}>{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="card-grid">
        {topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} buttonLabel={buttonLabel} />
        ))}
      </div>
    </section>
  );
}

const sectionStyles = {
  section:      { marginBottom: '3.25rem' },
  header:       { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.4rem', paddingBottom: '1.1rem', borderBottom: '2px solid #E2DDF2', flexWrap: 'wrap', gap: '0.75rem' },
  headerLeft:   { display: 'flex', alignItems: 'center', gap: '0.9rem' },
  sectionIcon:  { fontSize: '1.9rem', lineHeight: 1 },
  sectionTitle: { fontSize: '1.3rem', fontWeight: 800, color: '#24213A', marginBottom: '0.15rem' },
  sectionSub:   { fontSize: '0.9rem', color: '#857FA8' },
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function Preparation() {
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main">
        <div className="page-container">

          {/* Page header */}
          <div style={pageStyles.pageHeader}>
            <button
              className="btn-ghost"
              style={pageStyles.backBtn}
              onClick={() => navigate('/dashboard')}
            >
              ← Dashboard
            </button>
            <h1 style={pageStyles.pageTitle}>Preparation</h1>
            <p style={pageStyles.pageSubtitle}>
              Prepare smarter with topics commonly asked in placement interviews.
            </p>

            {/* Quick jump links */}
            <div style={pageStyles.jumpLinks}>
              <a href="#dsa"  style={pageStyles.jumpLink}>DSA</a>
              <a href="#core" style={pageStyles.jumpLink}>Core Subjects</a>
              <a href="#apt"  style={pageStyles.jumpLink}>Aptitude</a>
            </div>
          </div>

          {/* 1. DSA */}
          <PrepSection
            id="dsa"
            icon="💻"
            title="Data Structures & Algorithms"
            subtitle="Fundamental topics for coding rounds at every company."
            topics={DSA_TOPICS}
            buttonLabel="Practice"
          />

          {/* 2. Core Subjects */}
          <PrepSection
            id="core"
            icon="📘"
            title="Core Subjects"
            subtitle="Essential CS theory asked in technical interviews."
            topics={CORE_SUBJECTS}
            buttonLabel="Study"
          />

          {/* 3. Aptitude */}
          <PrepSection
            id="apt"
            icon="🧮"
            title="Aptitude"
            subtitle="Quantitative, logical, and verbal sections tested in most online assessments."
            topics={APTITUDE_TOPICS}
            buttonLabel="Practice"
          />

        </div>
      </main>
    </div>
  );
}

const pageStyles = {
  pageHeader:   { marginBottom: '2.75rem', paddingBottom: '1.75rem', borderBottom: '2px solid #E2DDF2' },
  backBtn:      { padding: '0.4rem 0', fontSize: '0.88rem', marginBottom: '1rem', display: 'inline-block' },
  pageTitle:    { fontSize: '2rem', fontWeight: 800, color: '#24213A', letterSpacing: '-0.025em', marginBottom: '0.4rem' },
  pageSubtitle: { fontSize: '0.97rem', color: '#857FA8', marginBottom: '1.4rem' },
  jumpLinks:    { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' },
  jumpLink:     { padding: '0.35rem 1rem', border: '2px solid #D4CBFF', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, color: '#7C5CFC', textDecoration: 'none', background: '#FFFFFF', transition: 'background 0.15s, transform 0.15s' },
};
