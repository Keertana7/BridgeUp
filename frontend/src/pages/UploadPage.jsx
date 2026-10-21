import { useState, useRef } from 'react';
import { ingestionApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './UploadPage.css';

const MAX_MB = 25;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function UploadPage() {
  const { isAuthenticated } = useAuth();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | accepted | error
  const [message, setMessage] = useState('');
  const [sourceFile, setSourceFile] = useState('');
  const [pollStatus, setPollStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  function handleFileChange(selectedFile) {
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setMessage('Only PDF files are supported.');
      setStatus('error');
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_BYTES) {
      setMessage(`PDF must be under ${MAX_MB} MB. This file is ${(selectedFile.size / 1024 / 1024).toFixed(1)} MB.`);
      setStatus('error');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setStatus('idle');
    setMessage('');
  }

  function handleInputChange(e) {
    handleFileChange(e.target.files?.[0] || null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files?.[0] || null);
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    setPollStatus('');

    try {
      const result = await ingestionApi.uploadPdf(file);
      setSourceFile(result.source_file);
      setStatus('accepted');
      setMessage(`"${result.filename}" was accepted for processing. We'll extract the content in the background.`);
      startPolling(result.source_file);
    } catch (err) {
      setStatus('error');
      setMessage(err?.message || 'Upload failed. Please try again.');
    }
  }

  function startPolling(sf) {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 20) {
        clearInterval(pollRef.current);
        setPollStatus('Processing is taking longer than expected. Check back later.');
        return;
      }
      try {
        const result = await ingestionApi.pdfStatus(sf);
        const s = result.extraction_status || 'pending';
        setPollStatus(`Processing status: ${s}`);
        if (s === 'done' || s === 'complete' || s === 'completed') {
          clearInterval(pollRef.current);
          setPollStatus('✅ Processing complete! Your experience is now in the database.');
        } else if (s === 'error' || s === 'failed') {
          clearInterval(pollRef.current);
          setPollStatus('❌ Processing failed. Please try uploading again.');
        }
      } catch {
        // Polling errors are silent — keep trying
      }
    }, 5000);
  }

  function reset() {
    clearInterval(pollRef.current);
    setFile(null);
    setStatus('idle');
    setMessage('');
    setSourceFile('');
    setPollStatus('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1 className="page-title">Share Your Experience</h1>
        <p className="page-subtitle">
          Upload a PDF of your interview experience and we&apos;ll extract the content automatically.
        </p>
      </div>

      {!isAuthenticated && (
        <div className="upload-auth-warn">
          ⚠️ You must be signed in to upload a PDF.
        </div>
      )}

      {isAuthenticated && status !== 'accepted' && (
        <>
          {/* Drop zone */}
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Drop PDF here or click to select"
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="drop-input"
              onChange={handleInputChange}
              aria-hidden="true"
            />
            {file ? (
              <div className="drop-selected">
                <span className="drop-icon">📄</span>
                <div>
                  <p className="drop-filename">{file.name}</p>
                  <p className="drop-filesize">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div className="drop-placeholder">
                <span className="drop-icon">📂</span>
                <p className="drop-label">Drop your PDF here, or click to browse</p>
                <p className="drop-hint">PDF only · Max {MAX_MB} MB · Must contain extractable text</p>
              </div>
            )}
          </div>

          {status === 'error' && (
            <div className="upload-error" role="alert">{message}</div>
          )}

          <div className="upload-actions">
            {file && (
              <button className="btn-secondary" onClick={reset}>
                Remove
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleUpload}
              disabled={!file || status === 'uploading'}
              aria-busy={status === 'uploading'}
            >
              {status === 'uploading' ? 'Uploading…' : 'Upload PDF'}
            </button>
          </div>
        </>
      )}

      {isAuthenticated && status === 'accepted' && (
        <div className="upload-success">
          <span className="success-icon">✅</span>
          <div>
            <p className="success-msg">{message}</p>
            {pollStatus && <p className="poll-status">{pollStatus}</p>}
          </div>
          <button className="btn-secondary" onClick={reset}>Upload another</button>
        </div>
      )}
    </div>
  );
}
