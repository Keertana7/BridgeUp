import { useNavigate } from "react-router-dom";

function Companies() {
  const navigate = useNavigate();

  const companies = [
    { id: 1,  name: "HSBC",              experiences: 3  },
    { id: 2,  name: "IBM",               experiences: 3  },
    { id: 3,  name: "Cognizant",         experiences: 3  },
    { id: 4,  name: "Rakuten",           experiences: 2  },
    { id: 5,  name: "Applied Materials", experiences: 2  },
    { id: 6,  name: "Accenture",         experiences: 2  },
    { id: 7,  name: "Infosys",           experiences: 2  },
    { id: 8,  name: "TCS",               experiences: 3  },
    { id: 9,  name: "Wipro",             experiences: 2  },
    { id: 10, name: "Capgemini",         experiences: 2  },
    { id: 11, name: "Deloitte",          experiences: 2  },
    { id: 12, name: "Amazon",            experiences: 2  },
    { id: 13, name: "Microsoft",         experiences: 2  },
    { id: 14, name: "Oracle",            experiences: 2  },
    { id: 15, name: "Cisco",             experiences: 2  },
  ];

  /* First 1–2 letters of the company name for the badge */
  function initials(name) {
    const words = name.split(" ");
    return words.length >= 2
      ? words[0][0].toUpperCase() + words[1][0].toUpperCase()
      : words[0].slice(0, 2).toUpperCase();
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── Page header ── */}
        <h1 style={styles.heading}>Companies</h1>
        <p style={styles.subheading}>
          Select a company to read real interview experiences shared by students.
        </p>

        {/* ── Grid ── */}
        <div style={styles.grid}>
          {companies.map((company) => (
            <div key={company.id} style={styles.card}>

              {/* Top row: badge + name/count */}
              <div style={styles.cardTop}>
                <div style={styles.badge}>{initials(company.name)}</div>
                <div style={styles.info}>
                  <p style={styles.companyName}>{company.name}</p>
                  <p style={styles.experienceCount}>
                    {company.experiences} experiences
                  </p>
                </div>
              </div>

              {/* Full-width button */}
              <button
                style={styles.btn}
                onMouseEnter={e => { e.currentTarget.style.background = "#6847E8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#7C5CFC"; e.currentTarget.style.transform = "translateY(0)"; }}
                onClick={() => navigate(`/companies/${company.id}`)}
              >
                View Experiences
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Companies;

/* ── Styles ─────────────────────────────────────────────── */
const styles = {
  page:         { minHeight: "100vh", background: "#F8F7FF", padding: "2rem 1.25rem" },
  container:    { maxWidth: "1050px", margin: "0 auto" },
  heading:      { fontSize: "1.9rem", fontWeight: 800, color: "#24213A", marginBottom: "0.35rem", letterSpacing: "-0.025em" },
  subheading:   { fontSize: "0.93rem", color: "#857FA8", marginBottom: "1.75rem" },
  grid:         { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" },
  card: {
    background: "#FFFFFF", borderRadius: "20px",
    padding: "1.5rem 1.5rem 1.35rem",
    boxShadow: "0 2px 8px rgba(36,33,58,0.07), 0 1px 3px rgba(36,33,58,0.04)",
    display: "flex", flexDirection: "column", gap: "1.1rem",
    border: "1px solid #E2DDF2",
    transition: "box-shadow 0.22s, transform 0.22s",
  },
  cardTop:         { display: "flex", alignItems: "center", gap: "0.9rem" },
  badge:           { width: "44px", height: "44px", borderRadius: "12px", background: "#EEE9FF", color: "#7C5CFC", fontWeight: 800, fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  info:            { flex: 1, minWidth: 0 },
  companyName:     { fontSize: "1rem", fontWeight: 700, color: "#24213A", marginBottom: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  experienceCount: { fontSize: "0.8rem", color: "#857FA8" },
  btn:             { width: "100%", padding: "0.65rem 0", background: "#7C5CFC", color: "#ffffff", border: "none", borderRadius: "13px", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", transition: "background 0.18s, transform 0.15s", boxShadow: "0 4px 14px rgba(124,92,252,0.28)" },
};
