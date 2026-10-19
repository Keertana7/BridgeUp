import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// ---------------------------------------------------------------------------
// Mock data — student placement stories
// Distinct from company interview experiences: these are personal journeys.
// ---------------------------------------------------------------------------
export const MOCK_STORIES = [
  {
    id: 'story-1',
    student: 'Priya M.',
    company: 'Amazon',
    role: 'SDE 1',
    batch: '2024',
    result: 'Selected ✅',
    summary:
      'Got placed at Amazon after 4 months of focused preparation. Failed the first OA but came back stronger with a strict LeetCode routine.',
    story: `I had always wanted to work at Amazon but honestly thought it was out of reach for me. I was from a tier-2 college with a decent CGPA but no prior internship experience.

I started preparation in September 2023, about 4 months before placements at our college. My plan was simple: solve 3 LeetCode problems every day, revise core subjects on weekends, and practice mock interviews every two weeks.

The first attempt in October went badly. I cleared the OA but completely blanked in the first technical round. I had prepared algorithms in isolation and had no practice explaining my thought process out loud. That was the biggest lesson — Amazon expects you to think aloud.

For the second attempt in January, I spent a month specifically practising mock interviews with a friend. We would sit together and explain our code as we wrote it. That made a huge difference.

The actual process:
- OA: 2 coding problems in 90 minutes. One medium array problem, one on trees. I solved both.
- Round 1: Two DSA problems. I talked through my approach before coding. The interviewer was helpful when I got stuck.
- Round 2: Leadership Principles heavy. They asked about a time I disagreed with a teammate and how I resolved it. Prepared STAR format answers saved me here.
- Round 3: Bar Raiser. Tough. A mix of LP and a hard coding problem. I didn't fully solve the coding problem but explained my approach clearly and got partial credit.

Result: Selected.

My advice: Don't underestimate Leadership Principles. Prepare at least 2 real stories for each of the 16 LPs before your Amazon interviews.`,
  },
  {
    id: 'story-2',
    student: 'Arjun K.',
    company: 'TCS',
    role: 'Digital Track',
    batch: '2024',
    result: 'Selected ✅',
    summary:
      'Went from zero coding confidence to cracking TCS Digital. The NQT preparation process completely changed how I approach problem solving.',
    story: `I'll be honest — I was not a strong programmer going into my final year. I could write basic Java code but had never solved a competitive programming problem in my life.

When placement season started, I panicked. My friends were solving LeetCode mediums and I was struggling with simple array traversals.

I decided to start from zero. Watched a full DSA course on YouTube, took notes, and spent 2 months just building the basics. Arrays, strings, sorting, basic recursion. Nothing fancy.

For TCS specifically, I practiced the NQT mock tests available on their platform. The pattern is predictable if you prepare specifically for it — quantitative, verbal, reasoning, and two coding problems.

The NQT went well. Both coding problems were easy-level — one string manipulation and one basic maths problem. I solved both within 30 minutes.

The interview was a combined technical and HR session. They asked about my projects, basic OOP concepts (I had revised these carefully), and one simple SQL query. The HR part was about why TCS, relocation, and the 2-year bond.

The interviewer was very friendly. I think my honest explanation of how I improved my skills actually worked in my favour.

Result: Selected for TCS Digital (7 LPA track), not just the standard track.

My advice: Don't compare your preparation to others. Start from where you are and be consistent. For TCS, practise their specific test format — the mock tests on their website are close to the real thing.`,
  },
  {
    id: 'story-3',
    student: 'Sneha R.',
    company: 'Deloitte',
    role: 'Business Technology Analyst',
    batch: '2024',
    result: 'Selected ✅',
    summary:
      'The Deloitte case study round was unexpected and scary. Here is how I prepared and what got me through.',
    story: `Deloitte was my dream company — not for the technical work, but because I wanted to be at the intersection of business and technology. The BTA role was exactly that.

The process at our college had four rounds:
1. Online aptitude test
2. Group discussion
3. Case study round
4. HR interview

The aptitude test was standard — quantitative, verbal, logical reasoning. I had been preparing these for other companies so it was manageable.

The group discussion was the first real challenge. Topic: "Should companies invest in AI-driven HR tools?" I had read about AI in HR that week coincidentally. I made three specific points and asked a follow-up question to another participant, which the moderator noticed.

The case study round was the most unexpected part. We were given a scenario: a mid-sized retail company is losing customers to online competitors. Propose a technology solution. 15 minutes to prepare, 10 minutes to present.

I structured my presentation in three parts: identify the root problems, propose solutions (a mobile app with loyalty features and a recommendation engine), and outline implementation phases. They asked about cost and data privacy — I didn't have perfect answers but I reasoned through both questions calmly.

The HR round was conversational. Why Deloitte, tell me about a failure, and a situational question about handling a team conflict.

Result: Selected.

My advice: For Deloitte, practise case studies. Use basic business frameworks — problem statement, solution, feasibility. You don't need MBA-level knowledge. Clear structured thinking is what they want.`,
  },
  {
    id: 'story-4',
    student: 'Rahul S.',
    company: 'Infosys',
    role: 'Digital Specialist Engineer',
    batch: '2024',
    result: 'Selected ✅',
    summary:
      'Applied for both Infosys tracks and got selected for the Digital Specialist Engineer role with a 9.5 LPA offer.',
    story: `A lot of people from my college applied to Infosys as a backup option. I applied with full seriousness because the DSE track is genuinely a good role.

The process started with the InfyTQ certification. Many students ignore this but it is the entry point. I completed the Java and DSA modules, scored well, and that put me in the DSE track pool.

The online test for DSE was harder than the standard track. Two coding problems — one on trees (level order traversal) and one dynamic programming problem (coin change). I had been practising medium-level LeetCode for three months so both were manageable.

The technical interview was about 50 minutes. The interviewer spent the first 15 minutes on my final year project. He asked me to explain my architecture decisions and how I would improve it. Then DSA: implement a BST, find the lowest common ancestor. Questions on time complexity followed every answer.

The HR round was standard but the interviewer asked specifically why I was applying to the DSE track and not joining a startup. I gave an honest answer about wanting structured learning and a strong peer group in my first job.

Result: Selected for DSE at 9.5 LPA.

My advice: Take InfyTQ seriously — it is not just a formality. Complete it early and score well. For the DSE track, medium-level DSA is the minimum bar.`,
  },
  {
    id: 'story-5',
    student: 'Divya T.',
    company: 'HSBC',
    role: 'Technology Analyst',
    batch: '2024',
    result: 'Selected ✅',
    summary:
      'As a non-CS student (ECE), getting into HSBC Technology required extra SQL and OOP preparation. Here is my honest account.',
    story: `I am from Electronics and Communication Engineering. Most placement preparation advice is written for CS students and I had to adapt everything.

HSBC visited our campus in September. The Technology Analyst role was open to all branches, which gave me a chance.

I started preparation from scratch on data structures (had only covered basics in one course), SQL (had never touched it before), and Python. That was 3 months of focused work.

The online test had aptitude, logical reasoning, and two easy coding problems. The aptitude section was the same as any campus placement test. The coding problems were easy — one on string reversal and one on basic array operations. I solved both.

The technical interview was about 45 minutes. The interviewer asked:
- Tell me about your final year project (mine was on signal processing — I explained it clearly and related it to data analysis)
- OOP concepts in Python — inheritance, polymorphism with examples
- SQL query: find the top 3 salaries from a table (I had specifically prepared this)
- What is REST API? (I had a simple answer ready)

The interviewer seemed genuinely curious about my ECE background. I think being from a different branch and still having strong fundamentals stood out.

Result: Selected.

My advice for non-CS students: You don't need to match CS students in depth. Focus on being very strong in the basics — OOP, SQL, one programming language — and be able to speak confidently about your own projects.`,
  },
  {
    id: 'story-6',
    student: 'Anonymous',
    company: 'Cognizant',
    role: 'GenC Elevate',
    batch: '2024',
    result: 'Selected ✅',
    summary:
      'Almost did not apply for Elevate because of self-doubt. Sharing this story because I wish someone had told me earlier that I was ready.',
    story: `I want to share this anonymously because I think the mental side of placements does not get talked about enough.

I had cleared the regular GenC test easily in the first round of our campus placements. But when Cognizant came for the Elevate track (higher package, technical role), I almost did not apply. I thought I was not "good enough" for the harder track.

A friend pushed me to apply. I spent one week revising medium-level DSA, DBMS (specifically normalisation and SQL), and prepared my projects properly.

The online test had two medium coding problems. One was a sliding window problem on maximum sum subarray of size k. The second was a graph problem — count islands. I had solved both types before and recognised them immediately.

The technical interview was the part I had dreaded most. But the interviewer was very calm and patient. He asked me to explain my project first, which I had rehearsed. Then DSA: check if two strings are anagrams (I gave the optimised HashMap approach), and a simple SQL query with GROUP BY.

The HR round asked specifically why I wanted the Elevate track over the standard track. I gave an honest answer — I wanted a role where I would keep learning technical skills from day one.

Result: Selected for GenC Elevate at 5.5 LPA.

My advice: Apply for the harder tracks even if you have self-doubt. You will not know until you try. One week of focused preparation for a specific track is often enough if your foundations are solid.`,
  },
  {
    id: 'story-7',
    student: 'Karthik B.',
    company: 'IBM',
    role: 'Application Developer',
    batch: '2024',
    result: 'Selected ✅',
    summary:
      'IBM had a case study round nobody in our batch expected. Here is exactly how I handled it with zero prior experience.',
    story: `IBM came to our campus in August. I had prepared standard DSA and core subjects but had no idea a case study round was part of the process.

When they announced Round 3 was a case study presentation, half the candidates in the waiting room panicked. I had 20 minutes to read the scenario and prepare.

The scenario: a logistics company is losing efficiency due to manual tracking of deliveries. Propose a software solution.

I had never prepared a case study in my life. I spent the first 5 minutes understanding the problem, the next 10 minutes writing a basic outline, and the last 5 minutes practising speaking it out loud.

My solution: a web application with a driver app for real-time delivery updates, a central dashboard for the operations team, and a notification system for customers. Simple database schema with deliveries, drivers, and customers tables.

During the presentation, they asked:
- What if the system goes down? (I said: redundant servers and data backups)
- What is the cost roughly? (I gave a rough estimate and said it depends on cloud provider)
- How would you test this? (I mentioned unit testing, integration testing, and UAT)

I did not have perfect answers. But I was calm, structured, and honest about what I did not know.

The HR round after was standard — teamwork, leadership, why IBM.

Result: Selected.

My advice: For case study rounds, structure your answer in three parts: problem identification, proposed solution, and implementation. You do not need perfect technical depth. Clear thinking under pressure is what they are testing.`,
  },
  {
    id: 'story-8',
    student: 'Meera V.',
    company: 'Wipro',
    role: 'Turbo Track',
    batch: '2024',
    result: 'Selected ✅',
    summary:
      'Chose Wipro Turbo over other offers because of the learning environment. Here is my experience and what I considered when making the decision.',
    story: `I had offers from two companies before Wipro visited — one from Cognizant GenC and one from Capgemini Analyst. Both were entry-level roles.

When Wipro came with the Turbo track, I decided to try for it because the package was better and the role description mentioned more technical work in the first year.

The online assessment had tougher aptitude than the standard Wipro test. Two medium coding problems: one on dynamic programming (0/1 knapsack), one on trees (height of binary tree). I had been practising these for two months.

The technical interview covered DBMS (joins, normalisation, one complex SQL query), OOPS with code examples in Java, and one live coding problem: find the kth largest element in an unsorted array. I solved it using a min-heap and explained the time complexity.

The HR interview was different from the others I had attended. The interviewer asked why I was choosing Wipro Turbo over my existing offers and what I expected to learn in the first year. I was honest about my reasoning — I wanted more challenging technical work from day one.

He appreciated the honesty and also asked about my backup plan if the role turned out to be different from what I expected. I said I would focus on building skills that would be transferable regardless.

Result: Selected for Turbo at 6.5 LPA.

My advice: When you have multiple offers, think about what you want to learn in the first 2 years — not just the package difference. Ask specific questions about the role during the interview. Companies notice when candidates have thought about the job beyond just getting selected.`,
  },
];

export default function StudentStories() {
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <Navbar />

      <main className="app-main">
        <div className="page-container">

          {/* Page header */}
          <div style={styles.pageHeader}>
            <h1 style={styles.pageTitle}>Student Stories</h1>
            <p style={styles.pageDesc}>
              Personal placement journeys shared by students — the struggles, the preparation, and the lessons.
            </p>
          </div>

          {/* Story cards */}
          <div style={styles.storyList}>
            {MOCK_STORIES.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onRead={() => navigate(`/student-stories/${story.id}`)}
              />
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}

function StoryCard({ story, onRead }) {
  return (
    <div className="card" style={styles.card}>
      <div style={styles.cardTop}>
        {/* Left — identity + meta */}
        <div style={styles.cardLeft}>
          <div style={styles.avatar}>
            {story.student === 'Anonymous' ? '?' : story.student[0]}
          </div>
          <div>
            <p style={styles.studentName}>{story.student}</p>
            <p style={styles.studentMeta}>
              {story.company} · {story.role} · Batch {story.batch}
            </p>
          </div>
        </div>

        {/* Result badge */}
        <span style={styles.resultBadge}>{story.result}</span>
      </div>

      <p style={styles.summary}>{story.summary}</p>

      <button
        className="btn-primary"
        style={styles.readBtn}
        onClick={onRead}
      >
        Read Story →
      </button>
    </div>
  );
}

const styles = {
  pageHeader:  { marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid #E5E1EC' },
  pageTitle:   { fontSize: '1.75rem', fontWeight: 800, color: '#25233A', letterSpacing: '-0.02em', marginBottom: '0.4rem' },
  pageDesc:    { fontSize: '0.95rem', color: '#85818D' },
  storyList:   { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  card:        { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#FFFDFC' },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' },
  cardLeft:    { display: 'flex', alignItems: 'center', gap: '0.85rem' },
  avatar:      { width: '40px', height: '40px', borderRadius: '50%', background: '#F0EDFA', color: '#8B7CF6', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  studentName: { fontSize: '0.97rem', fontWeight: 700, color: '#25233A', marginBottom: '0.1rem' },
  studentMeta: { fontSize: '0.82rem', color: '#85818D' },
  resultBadge: { fontSize: '0.82rem', fontWeight: 600, color: '#3E7A42', background: '#F0F4EE', padding: '0.2rem 0.75rem', borderRadius: '20px', border: '1px solid #C4D9BF', whiteSpace: 'nowrap' },
  summary:     { fontSize: '0.93rem', color: '#3F3C4D', lineHeight: 1.65 },
  readBtn:     { alignSelf: 'flex-start', padding: '0.5rem 1.1rem', fontSize: '0.9rem' },
};
