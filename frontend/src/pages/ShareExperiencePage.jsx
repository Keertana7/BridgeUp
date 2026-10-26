import { Link } from 'react-router-dom';
import './ShareExperiencePage.css';

const GOOGLE_FORM_URL = import.meta.env.VITE_GOOGLE_FORM_URL || '';

export default function ShareExperiencePage() {
  const formConfigured =
    GOOGLE_FORM_URL &&
    GOOGLE_FORM_URL !== 'https://forms.gle/your-bridgeup-form-url-here';

  return (
    <div className="share-page">
      <div className="share-page-header">
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        <h1 className="share-title">Share Your Experience</h1>
        <p className="share-subtitle">
          Help your juniors by contributing your interview experience to BridgeUp.
          Choose how you&apos;d like to share.
        </p>
      </div>

      <div className="share-options">
        {/* Option 1 — Google Form */}
        <div className="share-card">
          <div className="share-card-icon">📝</div>
          <div className="share-card-body">
            <h2 className="share-card-title">Share via Google Form</h2>
            <p className="share-card-desc">
              Fill in a structured Google Form with details about your interview experience.
              Your responses are automatically ingested into BridgeUp.
            </p>
            <ul className="share-card-points">
              <li>✅ Guided, step-by-step format</li>
              <li>✅ No file needed</li>
              <li>✅ Automatically processed</li>
            </ul>
          </div>
          <div className="share-card-action">
            {formConfigured ? (
              <a
                href={GOOGLE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="share-btn share-btn--primary"
              >
                Open Google Form ↗
              </a>
            ) : (
              <div className="share-form-unconfigured">
                <span className="share-btn share-btn--disabled" aria-disabled="true">
                  Open Google Form ↗
                </span>
                <p className="share-unconfigured-note">
                  ⚠️ Set <code>VITE_GOOGLE_FORM_URL</code> in <code>frontend/.env</code> to enable this button.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="share-divider">
          <span>or</span>
        </div>

        {/* Option 2 — PDF Upload */}
        <div className="share-card">
          <div className="share-card-icon">📄</div>
          <div className="share-card-body">
            <h2 className="share-card-title">Upload an Experience PDF</h2>
            <p className="share-card-desc">
              Already have your interview experience written as a document?
              Upload it as a PDF and we&apos;ll extract the content automatically using AI.
            </p>
            <ul className="share-card-points">
              <li>✅ Upload your own document</li>
              <li>✅ AI extracts questions &amp; advice</li>
              <li>✅ Max 25 MB · PDF only</li>
            </ul>
          </div>
          <div className="share-card-action">
            <Link to="/upload-experience" className="share-btn share-btn--secondary">
              Upload Experience PDF →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
