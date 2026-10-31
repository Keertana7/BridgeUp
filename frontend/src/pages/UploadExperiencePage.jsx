import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { companiesApi, ingestionApi, experiencesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { runPdfUploadFlow } from './pdfUploadFlow';
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
  // idle | validating | uploading | polling | pending | success | error
  const [statusMessage, setStatusMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploadSession, setUploadSession] = useState(null);

  const inputRef = useRef(null);

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
    if (pageStatus === 'uploading' || pageStatus === 'polling') return;

    let session = uploadSession;
    let metadata = session?.metadata;

    if (!session) {
      const errors = validate();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setPageStatus('validating');
        return;
      }

      setFieldErrors({});
      setPageStatus('uploading');
      setStatusMessage('Saving company details…');

      let company;
      try {
        company = await companiesApi.resolve(companyName.trim());
      } catch (err) {
        setPageStatus('error');
        setStatusMessage(
          err?.message || 'Could not save the company. Your PDF was not uploaded.'
        );
        return;
      }

      if (!company?.id) {
        setPageStatus('error');
        setStatusMessage('Could not resolve the company. Your PDF was not uploaded.');
        return;
      }

      metadata = {
        role: role.trim(),
        batch: String(batch),
        opportunity_type: opportunityType,
        selection_status: selectionStatus,
        consent: true,
        company_id: company.id,
      };
      if (packageVal.trim()) metadata.package = packageVal.trim();
    }

    setPageStatus(session ? 'polling' : 'uploading');
    setStatusMessage(
      session
        ? 'Checking the existing PDF processing status…'
        : 'Uploading your PDF…'
    );

    const result = await runPdfUploadFlow({
      file,
      session,
      metadata,
      userId: user?.id,
      uploadPdf: (pdf) => ingestionApi.uploadPdf(pdf),
      pdfStatus: (sourceFile) => ingestionApi.pdfStatus(sourceFile),
      patchExperience: (experienceId, updates) =>
        experiencesApi.patch(experienceId, updates),
      onSessionChange: setUploadSession,
    });

    if (result.status === 'upload_failed') {
      setPageStatus('error');
      setStatusMessage(
        result.error?.status === 0
          ? 'Cannot reach the backend. Make sure the server is running.'
          : result.error?.message || 'PDF upload failed. Please try again.'
      );
    } else if (result.status === 'metadata_failed') {
      setPageStatus('error');
      setStatusMessage(
        `Your PDF is processing, but its details could not be saved: ${result.error?.message || 'unknown error'}. Retry to save the details without uploading again.`
      );
    } else if (result.status === 'status_unavailable') {
      setPageStatus('error');
      setStatusMessage(
        `Could not check PDF processing status: ${result.error?.message || 'the status service is unavailable'}. Retry checking here; the PDF will not be uploaded again.`
      );
    } else if (result.status === 'processing_failed') {
      setPageStatus('processing_failed');
      setStatusMessage(
        'PDF processing failed. Your experience details were saved. You can retry the PDF upload to retry processing.'
      );
    } else if (result.status === 'pending') {
      setPageStatus('pending');
      setStatusMessage(
        result.session?.metadataAttached
          ? 'Your experience details are saved. PDF processing is still underway; continue checking here without uploading again.'
          : 'Your PDF was accepted and is still processing. Continue checking here without uploading again.'
      );
    } else {
      setPageStatus('success');
      setStatusMessage('Your interview experience was submitted successfully! 🎉');
    }
  }

  function reset() {
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
    setUploadSession(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const isSubmitting = pageStatus === 'uploading' || pageStatus === 'polling';
  const isLocked = isSubmitting || Boolean(uploadSession);

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
            disabled={isLocked}
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
            disabled={isLocked}
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
            disabled={isLocked}
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
            disabled={isLocked}
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
                  disabled={isLocked}
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
                  disabled={isLocked}
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
            onClick={() => !isLocked && inputRef.current?.click()}
            role="button"
            tabIndex={isLocked ? -1 : 0}
            aria-label="Drop PDF here or click to select"
            onKeyDown={(e) => e.key === 'Enter' && !isLocked && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="drop-input"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              aria-hidden="true"
              disabled={isLocked}
            />
            {file ? (
              <div className="drop-selected">
                <span className="drop-icon">📄</span>
                <div>
                  <p className="drop-filename">{file.name}</p>
                  <p className="drop-filesize">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!isLocked && (
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
        {(pageStatus === 'error' || pageStatus === 'processing_failed') && (
          <div className="submission-error" role="alert">
            ⚠️ {statusMessage}
          </div>
        )}

        {/* ── Submit ── */}
        <div className="form-actions">
          <Link to="/share-experience" className="btn-secondary" tabIndex={isLocked ? -1 : 0}>
            Cancel
          </Link>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || pageStatus === 'processing_failed'}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? statusMessage
              : pageStatus === 'processing_failed'
                ? 'Processing failed'
                : uploadSession
                  ? uploadSession.metadataAttached
                    ? 'Continue checking'
                    : uploadSession.experienceId
                      ? 'Retry saving details'
                      : 'Resume processing'
                : 'Submit Experience'}
          </button>
          {pageStatus === 'processing_failed' && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setUploadSession(null);
                setPageStatus('idle');
                setStatusMessage('');
              }}
            >
              Retry PDF upload
            </button>
          )}
          {pageStatus === 'pending' && (
            <p className="submission-status" role="status">
              {statusMessage}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
