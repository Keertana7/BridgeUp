import { useParams, useNavigate } from "react-router-dom";

// ─── Mock data ────────────────────────────────────────────────────────────────
// Company names keyed by the numeric id used in Companies.jsx
const COMPANY_NAMES = {
  1: "HSBC", 2: "IBM", 3: "Cognizant", 4: "Rakuten",
  5: "Applied Materials", 6: "Accenture", 7: "Infosys",
  8: "TCS", 9: "Wipro", 10: "Capgemini", 11: "Deloitte",
  12: "Amazon", 13: "Microsoft", 14: "Oracle", 15: "Cisco",
};

// Each experience has a unique string id used in the /experiences/:id route
const EXPERIENCES = {
  // ── HSBC ──────────────────────────────────────────────────────────────────
  1: [
    {
      id: "hsbc-1",
      role: "Software Engineer",
      batch: "2024",
      package: "8 LPA",
      difficulty: "Medium",
      preview:
        "Three rounds — aptitude, technical DSA, and HR. Strong focus on SQL and arrays.",
    },
    {
      id: "hsbc-2",
      role: "Technology Analyst",
      batch: "2024",
      package: "7.5 LPA",
      difficulty: "Easy",
      preview:
        "Online test followed by a single technical interview covering OOP and basic coding.",
    },
    {
      id: "hsbc-3",
      role: "Graduate Trainee",
      batch: "2023",
      package: "6.5 LPA",
      difficulty: "Medium",
      preview:
        "Group discussion, technical round with puzzles, and an HR discussion about banking domain.",
    },
  ],

  // ── IBM ───────────────────────────────────────────────────────────────────
  2: [
    {
      id: "ibm-1",
      role: "Associate Software Engineer",
      batch: "2024",
      package: "6.5 LPA",
      difficulty: "Medium",
      preview:
        "Aptitude and English test, then two technical rounds covering DSA and basic system design.",
    },
    {
      id: "ibm-2",
      role: "Application Developer",
      batch: "2024",
      package: "9 LPA",
      difficulty: "Hard",
      preview:
        "Four rounds including a case study presentation. Strong emphasis on problem solving and communication.",
    },
    {
      id: "ibm-3",
      role: "Software Developer",
      batch: "2023",
      package: "7 LPA",
      difficulty: "Medium",
      preview:
        "Coding round with two DSA problems, followed by technical interview on OS, DBMS, and CN.",
    },
  ],

  // ── Cognizant ─────────────────────────────────────────────────────────────
  3: [
    {
      id: "cog-1",
      role: "Programmer Analyst Trainee",
      batch: "2024",
      package: "4 LPA",
      difficulty: "Easy",
      preview:
        "GenC drive — online test with aptitude, verbal, and coding. Simple logic-based questions.",
    },
    {
      id: "cog-2",
      role: "GenC Elevate",
      batch: "2024",
      package: "5.5 LPA",
      difficulty: "Medium",
      preview:
        "Higher cut-off and a harder coding section. Two DSA problems and a technical interview.",
    },
    {
      id: "cog-3",
      role: "Programmer Analyst",
      batch: "2023",
      package: "4.5 LPA",
      difficulty: "Easy",
      preview:
        "Campus drive with group discussion, TR, and MR. Focus on projects and OOP concepts.",
    },
  ],

  // ── Rakuten ───────────────────────────────────────────────────────────────
  4: [
    {
      id: "rak-1",
      role: "Software Engineer",
      batch: "2024",
      package: "20 LPA",
      difficulty: "Hard",
      preview:
        "Competitive coding test on HackerRank, then two technical interviews. One focused purely on algorithms.",
    },
    {
      id: "rak-2",
      role: "Backend Engineer",
      batch: "2023",
      package: "22 LPA",
      difficulty: "Hard",
      preview:
        "Three coding rounds and a system design round. Expected strong knowledge of distributed systems.",
    },
  ],

  // ── Applied Materials ─────────────────────────────────────────────────────
  5: [
    {
      id: "apm-1",
      role: "Engineer I",
      batch: "2024",
      package: "12 LPA",
      difficulty: "Medium",
      preview:
        "Written test on C/C++ and embedded basics, followed by two technical rounds and an HR round.",
    },
    {
      id: "apm-2",
      role: "Process Engineer",
      batch: "2023",
      package: "10 LPA",
      difficulty: "Medium",
      preview:
        "Domain-focused questions on semiconductor manufacturing, plus a coding round in Python.",
    },
  ],

  // ── Accenture ─────────────────────────────────────────────────────────────
  6: [
    {
      id: "acc-1",
      role: "Associate Software Engineer",
      batch: "2024",
      package: "4.5 LPA",
      difficulty: "Easy",
      preview:
        "Online assessment with cognitive ability, technical, and coding sections. Friendly HR round.",
    },
    {
      id: "acc-2",
      role: "Packaged App Development Associate",
      batch: "2024",
      package: "6.5 LPA",
      difficulty: "Easy",
      preview:
        "Technical test focused on SAP basics. HR discussion about career goals and relocation.",
    },
  ],

  // ── Infosys ───────────────────────────────────────────────────────────────
  7: [
    {
      id: "inf-1",
      role: "Systems Engineer",
      batch: "2024",
      package: "3.6 LPA",
      difficulty: "Easy",
      preview:
        "InfyTQ certification followed by an online test and HR interview. Straightforward process.",
    },
    {
      id: "inf-2",
      role: "Digital Specialist Engineer",
      batch: "2024",
      package: "9.5 LPA",
      difficulty: "Medium",
      preview:
        "Harder coding round with two medium DSA problems. Technical and HR rounds.",
    },
  ],

  // ── TCS ───────────────────────────────────────────────────────────────────
  8: [
    {
      id: "tcs-1",
      role: "Assistant System Engineer",
      batch: "2024",
      package: "3.36 LPA",
      difficulty: "Easy",
      preview:
        "TCS NQT exam with numerical ability, reasoning, and coding. Simple HR round.",
    },
    {
      id: "tcs-2",
      role: "Digital",
      batch: "2024",
      package: "7 LPA",
      difficulty: "Medium",
      preview:
        "Advanced NQT followed by technical and managerial interview rounds.",
    },
    {
      id: "tcs-3",
      role: "Prime",
      batch: "2024",
      package: "11.5 LPA",
      difficulty: "Hard",
      preview:
        "Competitive coding test, then a technical interview focused on DSA and system design.",
    },
  ],

  // ── Wipro ─────────────────────────────────────────────────────────────────
  9: [
    {
      id: "wip-1",
      role: "Project Engineer",
      batch: "2024",
      package: "3.5 LPA",
      difficulty: "Easy",
      preview:
        "Online test with aptitude and coding, followed by technical and HR rounds.",
    },
    {
      id: "wip-2",
      role: "Turbo",
      batch: "2024",
      package: "6.5 LPA",
      difficulty: "Medium",
      preview:
        "Tougher aptitude and two coding problems. Technical interview covered DBMS and OOPS.",
    },
  ],

  // ── Capgemini ─────────────────────────────────────────────────────────────
  10: [
    {
      id: "cap-1",
      role: "Analyst",
      batch: "2024",
      package: "4 LPA",
      difficulty: "Easy",
      preview:
        "Game-based assessment followed by technical and HR interviews. Relaxed atmosphere.",
    },
    {
      id: "cap-2",
      role: "Senior Analyst",
      batch: "2023",
      package: "5 LPA",
      difficulty: "Easy",
      preview:
        "Online test with pseudo-code section. Technical interview about projects and OOP.",
    },
  ],

  // ── Deloitte ──────────────────────────────────────────────────────────────
  11: [
    {
      id: "del-1",
      role: "Business Technology Analyst",
      batch: "2024",
      package: "9 LPA",
      difficulty: "Medium",
      preview:
        "Group discussion, case study round, and a technical interview. Communication is key.",
    },
    {
      id: "del-2",
      role: "Analyst",
      batch: "2023",
      package: "7.5 LPA",
      difficulty: "Medium",
      preview:
        "Technical rounds covering DSA, DBMS, and networking basics. Strong HR round.",
    },
  ],

  // ── Amazon ────────────────────────────────────────────────────────────────
  12: [
    {
      id: "amz-1",
      role: "SDE Intern",
      batch: "2024",
      package: "100K INR/month",
      difficulty: "Hard",
      preview:
        "Two coding rounds with LeetCode-style problems. LP (Leadership Principles) round.",
    },
    {
      id: "amz-2",
      role: "SDE 1",
      batch: "2024",
      package: "32 LPA",
      difficulty: "Hard",
      preview:
        "OA with two coding problems, then four interview rounds covering DSA, design, and LP.",
    },
  ],

  // ── Microsoft ─────────────────────────────────────────────────────────────
  13: [
    {
      id: "msft-1",
      role: "SWE Intern",
      batch: "2024",
      package: "80K INR/month",
      difficulty: "Hard",
      preview:
        "Coding test followed by three technical interview rounds covering DSA and system design.",
    },
    {
      id: "msft-2",
      role: "Software Engineer",
      batch: "2024",
      package: "40 LPA",
      difficulty: "Hard",
      preview:
        "Five rounds including coding, system design, and a hiring manager round.",
    },
  ],

  // ── Oracle ────────────────────────────────────────────────────────────────
  14: [
    {
      id: "ora-1",
      role: "Applications Engineer",
      batch: "2024",
      package: "10 LPA",
      difficulty: "Medium",
      preview:
        "Online assessment followed by two technical rounds and an HR interview.",
    },
    {
      id: "ora-2",
      role: "Cloud Engineer",
      batch: "2023",
      package: "12 LPA",
      difficulty: "Medium",
      preview:
        "Technical rounds covering databases, cloud basics, and one coding problem.",
    },
  ],

  // ── Cisco ─────────────────────────────────────────────────────────────────
  15: [
    {
      id: "cis-1",
      role: "Software Engineer",
      batch: "2024",
      package: "18 LPA",
      difficulty: "Medium",
      preview:
        "Coding test with networking-flavoured problems, then two technical interviews.",
    },
    {
      id: "cis-2",
      role: "Network Engineer",
      batch: "2023",
      package: "14 LPA",
      difficulty: "Medium",
      preview:
        "Technical rounds on networking fundamentals, followed by an HR discussion.",
    },
  ],
};

const DIFF_STYLE = {
  Easy:   { background: "#E3F8EE", color: "#1E8A4C", border: "1px solid #A8E4C4" },
  Medium: { background: "#FFF8E1", color: "#B86A00", border: "1px solid #FFE082" },
  Hard:   { background: "#FEF0EE", color: "#C0392B", border: "1px solid #F0C0BB" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Experiences() {
  const { companyId } = useParams();
  const navigate      = useNavigate();

  const id          = Number(companyId);
  const companyName = COMPANY_NAMES[id] ?? "Company";
  const list        = EXPERIENCES[id]   ?? [];

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Header ─────────────────────────────────────────── */}
        <button style={styles.backLink} onClick={() => navigate("/companies")}>
          ← Back to Companies
        </button>

        <div style={styles.pageHeader}>
          <p style={styles.pageLabel}>BRIDGEUP • PLACEMENT PREPARATION</p>
          <h1 style={styles.pageTitle}>{companyName}</h1>
          <p style={styles.pageSubtitle}>
            {list.length} student interview experience{list.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Empty state ─────────────────────────────────────── */}
        {list.length === 0 && (
          <div style={styles.emptyBox}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📭</p>
            <p style={{ color: "#85818D" }}>No experiences shared for this company yet.</p>
          </div>
        )}

        {/* ── Experience cards ────────────────────────────────── */}
        <div style={styles.cardList}>
          {list.map((exp) => (
            <div key={exp.id} style={styles.card}>

              {/* Top row: role + difficulty badge */}
              <div style={styles.cardTop}>
                <div>
                  <h2 style={styles.role}>{exp.role}</h2>
                  <p style={styles.batch}>Batch {exp.batch}</p>
                </div>
                {exp.difficulty && (
                  <span style={{ ...styles.badge, ...(DIFF_STYLE[exp.difficulty] ?? {}) }}>
                    {exp.difficulty}
                  </span>
                )}
              </div>

              {/* Chips row */}
              <div style={styles.chipsRow}>
                {exp.package && <span style={styles.chip}>💰 {exp.package}</span>}
                <span style={styles.chip}>🎓 Batch {exp.batch}</span>
                {exp.difficulty && (
                  <span style={{ ...styles.chip, ...(DIFF_STYLE[exp.difficulty] ?? {}) }}>
                    {exp.difficulty}
                  </span>
                )}
              </div>

              {/* Preview */}
              <p style={styles.preview}>"{exp.preview}"</p>

              {/* CTA */}
              <button
                style={styles.readBtn}
                onMouseEnter={e => { e.currentTarget.style.background = "#6847E8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#7C5CFC"; e.currentTarget.style.transform = "translateY(0)"; }}
                onClick={() => navigate(`/experiences/${exp.id}`)}
              >
                Read Full Experience →
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const styles = {
  page:         { minHeight: "100vh", background: "#F8F7FF", padding: "2rem 1rem" },
  container:    { maxWidth: "860px", margin: "0 auto" },
  backLink:     { display: "inline-block", marginBottom: "1.5rem", background: "none", border: "none", color: "#7C5CFC", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", padding: "0" },
  pageHeader:   { marginBottom: "2rem" },
  pageLabel:    { fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", color: "#7DD3A8", textTransform: "uppercase", marginBottom: "0.4rem" },
  pageTitle:    { fontSize: "2.1rem", fontWeight: 800, color: "#24213A", letterSpacing: "-0.03em", marginBottom: "0.3rem" },
  pageSubtitle: { fontSize: "0.95rem", color: "#857FA8" },
  emptyBox:     { textAlign: "center", padding: "4rem 2rem", background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2DDF2" },
  cardList:     { display: "flex", flexDirection: "column", gap: "1.25rem" },
  card: {
    background: "#FFFFFF", border: "1px solid #E2DDF2", borderRadius: "20px",
    padding: "1.6rem 1.9rem",
    boxShadow: "0 2px 10px rgba(36,33,58,0.06), 0 4px 18px rgba(36,33,58,0.04)",
    display: "flex", flexDirection: "column", gap: "0.9rem",
    transition: "box-shadow 0.22s, transform 0.22s",
  },
  cardTop:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" },
  role:     { fontSize: "1.18rem", fontWeight: 700, color: "#24213A", marginBottom: "0.2rem" },
  batch:    { fontSize: "0.85rem", color: "#857FA8" },
  badge:    { display: "inline-block", padding: "0.28rem 0.85rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" },
  chipsRow: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  chip:     { display: "inline-flex", alignItems: "center", gap: "0.3rem", background: "#F4F2FC", border: "1px solid #E2DDF2", borderRadius: "8px", padding: "0.26rem 0.72rem", fontSize: "0.82rem", color: "#857FA8", fontWeight: 600 },
  preview:  { fontSize: "0.95rem", color: "#4D4960", lineHeight: 1.75, fontStyle: "italic" },
  readBtn:  { alignSelf: "flex-start", background: "#7C5CFC", color: "#fff", border: "none", borderRadius: "13px", padding: "0.65rem 1.45rem", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", transition: "background 0.18s, transform 0.15s", boxShadow: "0 4px 14px rgba(124,92,252,0.28)" },
};
