import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { companiesApi, ingestionApi, experiencesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './UploadExperiencePage.css';

const MAX_MB = 25;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// Exact values the backend accepts for opportunity_type and selection_status
const OPPORTUNITY_TYPES = ['Internship', 'Full-time', 'Internship + Full-time', 'Apprenticeship'];
const SELECTION_STATUSES = ['Selected', 'Not Selected', 'Declined'];

const CURRENT_YEAR = new Date().getFullYear();
// Allow batch years from 2 years ago to 5 years ahead
const BATCH_YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - 2 + i);

// ─── Page ────────────────────────────────────────────────────────────────────

export default function UploadExperiencePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Load existing companies silently — used only to resolve a UUID if the
  // typed name matches an existing company exactly (case-insensitive).
  // The user is NOT restricted to this list.
  const { data: companies } = useFetch(() => companiesApi.list(), []);

  // Form field state — field names match the existing experiences table schema
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [batch, setBatch] = useState('');
  const [packageVal, setPackageVal] = useState('');
  const [opportunityType, setOpportunityType] = useState('');
  const [selectionStatus, setSelectionStatus] = useState('');
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Submission state
  const [pageStatus, setPageStatus] = useState('idle');
  // idle | validating | uploading | patching | polling | success | error
  const [statusMessage, setStatusMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // ── File handling ──────────────────────────────────────────────────────────

  function handleFileSelect(selected) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setFieldErrors((e) => ({ ...e, file: 'Only PDF files are supported.' }));
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFieldErrors((e) => ({
        ...e,
        file: `File must be under ${MAX_MB} MB. This file is ${(selected.size / 1024 / 1024).toFixed(1)} MB.`,
      }));
      return;
    }
    setFile(selected);
    setFieldErrors((e) => ({ ...e, file: undefined }));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files?.[0] || null);
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validate() {
    const errors = {};
    if (!companyName.trim()) errors.company = 'Company name is required.';
    if (!role.trim()) errors.role = 'Role is required.';
    if (!batch) errors.batch = 'Graduation / batch year is required.';
    if (!opportunityType) errors.opportunityType = 'Please select the opportunity type.';
    if (!selectionStatus) errors.selectionStatus = 'Please select the selection status.';
    if (!file) errors.file = 'Please select a PDF file to upload.';
    return errors;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    if (pageStatus === 'uploading' || pageStatus === 'patching' || pageStatus === 'polling') return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setPageStatus('validating');
      return;
    }

    setFieldErrors({});
    setPageStatus('uploading');
    setStatusMessage('Uploading your PDF…');

    // Step 1 — Upload PDF to existing endpoint POST /ingestion/pdfs
    let uploadResult;
    try {
      uploadResult = await ingestionApi.uploadPdf(file);
    } catch (err) {
      setPageStatus('error');
      setStatusMessage(
        err?.status === 0
          ? 'Cannot reach the backend. Make sure the server is running.'
          : err?.message || 'Upload failed. Please try again.'
      );
      return;
    }

    const sourceFile = uploadResult.source_file;

    // Step 2 — Poll pdf-status until experience row is created (we need the id)
    setPageStatus('polling');
    setStatusMessage('Processing your PDF… This may take a moment.');

    let experienceId = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 × 3 s = 90 s max wait

    await new Promise((resolve) => {
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const statusResult = await ingestionApi.pdfStatus(sourceFile);
          if (statusResult?.id) {
            experienceId = statusResult.id;
            clearInterval(pollRef.current);
            resolve();
          } else if (attempts >= maxAttempts) {
            clearInterval(pollRef.current);
            resolve();
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(pollRef.current);
            resolve();
          }
        }
      }, 3000);
    });

    if (!experienceId) {
      // PDF was accepted but experience row not yet created — still success
      // We can't attach metadata yet; inform the user
      setPageStatus('success');
      setStatusMessage(
        'Your PDF was uploaded and is being processed! ' +
          'Metadata could not be attached yet as processing is still in progress — ' +
          'the content has been saved and will be available shortly.'
      );
      return;
    }

    // Step 3 — PATCH the experience with metadata using existing PATCH /experiences/{id}
    setPageStatus('patching');
    setStatusMessage('Saving your details…');

    const metadata = {
      role: role.trim(),
      batch: String(batch),
      opportunity_type: opportunityType,
      selection_status: selectionStatus,
      consent: true,
    };
    if (packageVal.trim()) metadata.package = packageVal.trim();
    if (user?.id) metadata.submitted_by = user.id;
    // Silently resolve company UUID if the typed name matches an existing company.
    // If it doesn't match (new company), omit company_id — the pipeline will
    // handle company creation from the PDF content via get_or_create_company.
    if (companies) {
      const match = companies.find(
        (c) => c.name.toLowerCase() === companyName.trim().toLowerCase()
      );
      if (match) metadata.company_id = match.id;
    }

    try {
      await experiencesApi.patch(experienceId, metadata);
    } catch (err) {
      // Metadata patch failed — PDF is still uploaded and being processed
      setPageStatus('success');
      setStatusMessage(
        'Your PDF was uploaded successfully! ' +
          'However, some metadata could not be saved (' +
          (err?.message || 'unknown error') +
          '). The content is still being processed.'
      );
      return;
    }

    setPageStatus('success');
    setStatusMessage('Your interview experience was submitted successfully! 🎉');
  }

  function reset() {
    clearInterval(pollRef.current);
    setCompanyName('');
    setRole('');
    setBatch('');
    setPackageVal('');
    setOpportunityType('');
    setSelectionStatus('');
    setFile(null);
    setPageStatus('idle');
    setStatusMessage('');
    setFieldErrors({});
    if (inputRef.current) inputRef.current.value = '';
  }

  const isSubmitting =
    pageStatus === 'uploading' || pageStatus === 'patching' || pageStatus === 'polling';

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="upload-exp-page">
        <Link to="/share-experience" className="back-link">← Back</Link>
        <div className="auth-warn">
          ⚠️ You must be signed in to submit an experience.{' '}
          <Link to="/login" className="auth-warn-link">Sign in</Link>
        </div>
      </div>
    );
  }

  if (pageStatus === 'success') {
    return (
      <div className="upload-exp-page">
        <div className="success-state">
          <div className="success-icon">🎉</div>
          <h2 className="success-title">Experience Submitted!</h2>
          <p className="success-msg">{statusMessage}</p>
          <div className="success-actions">
            <button className="btn-secondary" onClick={reset}>
              Submit another
            </button>
            <Link to="/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-exp-page">
      <Link to="/share-experience" className="back-link">← Back</Link>

      <div className="upload-exp-header">
        <h1 className="upload-exp-title">Upload Experience PDF</h1>
        <p className="upload-exp-subtitle">
          Fill in your interview details and attach your experience as a PDF.
          Our AI will extract questions and advice automatically.
        </p>
      </div>

      <form className="upload-exp-form" onSubmit={handleSubmit} noValidate>

        {/* ── Company ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="company-input">
            Company <span className="required">*</span>
          </label>
          <input
            id="company-input"
            type="text"
            className={`form-input ${fieldErrors.company ? 'input-error' : ''}`}
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              setFieldErrors((err) => ({ ...err, company: undefined }));
            }}
            placeholder="Type company name"
            autoComplete="off"
            disabled={isSubmitting}
          />
          {fieldErrors.company && <p className="field-error">{fieldErrors.company}</p>}
        </div>

        {/* ── Role ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="role-input">
            Role <span className="required">*</span>
          </label>
          <input
            id="role-input"
            type="text"
            className={`form-input ${fieldErrors.role ? 'input-error' : ''}`}
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setFieldErrors((err) => ({ ...err, role: undefined }));
            }}
            placeholder="e.g. Software Engineer"
            disabled={isSubmitting}
          />
          {fieldErrors.role && <p className="field-error">{fieldErrors.role}</p>}
        </div>

        {/* ── Batch Year ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="batch-input">
            Graduation / Batch Year <span className="required">*</span>
          </label>
          <select
            id="batch-input"
            className={`form-select ${fieldErrors.batch ? 'input-error' : ''}`}
            value={batch}
            onChange={(e) => {
              setBatch(e.target.value);
              setFieldErrors((err) => ({ ...err, batch: undefined }));
            }}
            disabled={isSubmitting}
          >
            <option value="">Select year</option>
            {BATCH_YEARS.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          {fieldErrors.batch && <p className="field-error">{fieldErrors.batch}</p>}
        </div>

        {/* ── Package ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="package-input">
            Salary / Package <span className="optional">(optional)</span>
          </label>
          <input
            id="package-input"
            type="text"
            className="form-input"
            value={packageVal}
            onChange={(e) => setPackageVal(e.target.value)}
            placeholder="e.g. 12 LPA or ₹50,000/month"
            disabled={isSubmitting}
          />
        </div>

        {/* ── Opportunity Type ── */}
        <div className="form-group">
          <label className="form-label">
            Type of Opportunity <span className="required">*</span>
          </label>
          <div className="radio-group">
            {OPPORTUNITY_TYPES.map((opt) => (
              <label key={opt} className={`radio-option ${opportunityType === opt ? 'checked' : ''}`}>
                <input
                  type="radio"
                  name="opportunityType"
                  value={opt}
                  checked={opportunityType === opt}
                  onChange={() => {
                    setOpportunityType(opt);
                    setFieldErrors((err) => ({ ...err, opportunityType: undefined }));
                  }}
                  disabled={isSubmitting}
                />
                {opt}
              </label>
            ))}
          </div>
          {fieldErrors.opportunityType && (
            <p className="field-error">{fieldErrors.opportunityType}</p>
          )}
        </div>

        {/* ── Selection Status ── */}
        <div className="form-group">
          <label className="form-label">
            Selection Status <span className="required">*</span>
          </label>
          <div className="radio-group">
            {SELECTION_STATUSES.map((opt) => (
              <label key={opt} className={`radio-option ${selectionStatus === opt ? 'checked' : ''}`}>
                <input
                  type="radio"
                  name="selectionStatus"
                  value={opt}
                  checked={selectionStatus === opt}
                  onChange={() => {
                    setSelectionStatus(opt);
                    setFieldErrors((err) => ({ ...err, selectionStatus: undefined }));
                  }}
                  disabled={isSubmitting}
                />
                {opt}
              </label>
            ))}
          </div>
          {fieldErrors.selectionStatus && (
            <p className="field-error">{fieldErrors.selectionStatus}</p>
          )}
        </div>

        {/* ── PDF File ── */}
        <div className="form-group">
          <label className="form-label">
            Experience PDF <span className="required">*</span>
          </label>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''} ${fieldErrors.file ? 'zone-error' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isSubmitting && inputRef.current?.click()}
            role="button"
            tabIndex={isSubmitting ? -1 : 0}
            aria-label="Drop PDF here or click to select"
            onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="drop-input"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              aria-hidden="true"
              disabled={isSubmitting}
            />
            {file ? (
              <div className="drop-selected">
                <span className="drop-icon">📄</span>
                <div>
                  <p className="drop-filename">{file.name}</p>
                  <p className="drop-filesize">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!isSubmitting && (
                  <button
                    type="button"
                    className="drop-clear"
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <div className="drop-placeholder">
                <span className="drop-icon">📂</span>
                <p className="drop-label">Drop your PDF here, or click to browse</p>
                <p className="drop-hint">PDF only · Max {MAX_MB} MB · Must contain extractable text</p>
              </div>
            )}
          </div>
          {fieldErrors.file && <p className="field-error">{fieldErrors.file}</p>}
        </div>

        {/* ── Status message during submission ── */}
        {isSubmitting && (
          <div className="submission-status" role="status" aria-live="polite">
            <div className="submission-spinner" aria-hidden="true" />
            <p>{statusMessage}</p>
          </div>
        )}

        {/* ── Error ── */}
        {pageStatus === 'error' && (
          <div className="submission-error" role="alert">
            ⚠️ {statusMessage}
          </div>
        )}

        {/* ── Submit ── */}
        <div className="form-actions">
          <Link to="/share-experience" className="btn-secondary" tabIndex={isSubmitting ? -1 : 0}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? statusMessage : 'Submit Experience'}
          </button>
        </div>
      </form>
    </div>
  );
}
