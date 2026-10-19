import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { MOCK_STORIES } from './StudentStories';

export default function StudentStoryDetails() {
  const { storyId } = useParams();
  const navigate = useNavigate();

  const story = MOCK_STORIES.find((s) => s.id === storyId);

  if (!story) {
    return (
      <div className="app-layout">
        <Navbar />
        <main className="app-main">
          <div className="page-container">
            <button
              className="btn-ghost"
              style={styles.backBtn}
              onClick={() => navigate('/student-stories')}
            >
              ← Back to Student Stories
            </button>
            <div className="state-box">
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
              <h3>Story not found</h3>
              <p>This student story could not be found.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main">
        <div className="page-container" style={{ maxWidth: '800px' }}>

          {/* Breadcrumb */}
          <nav style={styles.breadcrumb}>
            <button
              className="btn-ghost"
              style={styles.crumbBtn}
              onClick={() => navigate('/student-stories')}
            >
              Student Stories
            </button>
            <span style={styles.crumbSep}>›</span>
            <span style={styles.crumbCurrent}>{story.student}</span>
          </nav>

          {/* Header card */}
          <div style={styles.headerCard}>
            <div style={styles.headerTop}>
              <div style={styles.avatarLarge}>
                {story.student === 'Anonymous' ? '?' : story.student[0]}
              </div>
              <div style={styles.headerInfo}>
                <h1 style={styles.studentName}>{story.student}</h1>
                <p style={styles.studentMeta}>
                  {story.company} · {story.role}
                </p>
                <p style={styles.studentMeta}>Batch of {story.batch}</p>
              </div>
            </div>

            {/* Meta chips */}
            <div style={styles.metaRow}>
              <span style={styles.chip}>🏢 {story.company}</span>
              <span style={styles.chip}>💼 {story.role}</span>
              <span style={styles.chip}>🎓 Batch {story.batch}</span>
              <span style={styles.resultChip}>{story.result}</span>
            </div>
          </div>

          {/* Story text */}
          <div style={styles.section}>
            <h2 style={styles.sectionHeading}>📖 The Story</h2>
            <div style={styles.storyText}>{story.story}</div>
          </div>

          {/* Back button */}
          <div style={{ marginTop: '2rem' }}>
            <button
              className="btn-primary"
              onClick={() => navigate('/student-stories')}
            >
              ← Back to Student Stories
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

const styles = {
  backBtn: {
    marginBottom: '1.25rem',
    padding: '0.4rem 0',
    fontSize: '0.9rem',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  crumbBtn: {
    fontSize: '0.85rem',
    padding: '0.2rem 0.4rem',
  },
  crumbSep:    { color: '#C4BFD4', fontSize: '0.9rem' },
  crumbCurrent: { fontSize: '0.85rem', color: '#85818D', padding: '0.2rem 0.4rem' },
  headerCard: {
    background: '#FFFDFC', border: '1px solid #E5E1EC', borderRadius: '18px',
    padding: '1.5rem', marginBottom: '2rem',
    boxShadow: '0 1px 4px rgba(37,35,58,0.06), 0 4px 14px rgba(37,35,58,0.04)',
    display: 'flex', flexDirection: 'column', gap: '1.1rem',
  },
  headerTop:    { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  avatarLarge:  { width: '56px', height: '56px', borderRadius: '50%', background: '#F0EDFA', color: '#8B7CF6', fontWeight: 700, fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerInfo:   { flex: 1 },
  studentName:  { fontSize: '1.3rem', fontWeight: 700, color: '#25233A', marginBottom: '0.25rem' },
  studentMeta:  { fontSize: '0.9rem', color: '#85818D', marginBottom: '0.1rem' },
  metaRow:      { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  chip:         { background: '#F4F1EC', border: '1px solid #E5E1EC', borderRadius: '8px', padding: '0.25rem 0.65rem', fontSize: '0.82rem', color: '#85818D' },
  resultChip:   { background: '#F0F4EE', border: '1px solid #C4D9BF', borderRadius: '8px', padding: '0.25rem 0.65rem', fontSize: '0.82rem', fontWeight: 600, color: '#3E7A42' },
  section:      { marginBottom: '2rem' },
  sectionHeading: { fontSize: '1.05rem', fontWeight: 700, color: '#25233A', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid #E5E1EC' },
  storyText:    { background: '#F7F5F0', border: '1px solid #E5E1EC', borderRadius: '12px', padding: '1.4rem 1.6rem', fontSize: '0.97rem', lineHeight: 1.9, color: '#3F3C4D', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
};
