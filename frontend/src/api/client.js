/**
 * Central API client for the BridgeUp FastAPI backend.
 *
 * All HTTP calls go through `apiFetch` which:
 *  - Reads the base URL from VITE_API_URL (primary app) or VITE_AI_API_URL (AI/chat app)
 *  - Attaches the Supabase access token as a Bearer header when available
 *  - Throws a structured ApiError so callers can distinguish HTTP errors from network errors
 */

import { supabase } from './supabase';

const PRIMARY_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const AI_BASE = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  /**
   * @param {number} status  HTTP status code (0 = network error)
   * @param {string} message Human-readable message
   * @param {unknown} detail  Raw detail field from the FastAPI response, if any
   */
  constructor(status, message, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Make a fetch request to a BridgeUp backend.
 *
 * @param {string} path       Path starting with `/`, e.g. `/companies/`
 * @param {RequestInit} opts  Standard fetch options (method, body, etc.)
 * @param {'primary'|'ai'} base  Which backend to target (default: `primary`)
 * @returns {Promise<unknown>} Parsed JSON response
 */
async function apiFetch(path, opts = {}, base = 'primary') {
  const baseUrl = base === 'ai' ? AI_BASE : PRIMARY_BASE;
  const url = `${baseUrl}${path}`;

  // Attach auth header if the user is signed in
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  let response;
  try {
    response = await fetch(url, { ...opts, headers });
  } catch (err) {
    // Network-level failure (backend unreachable, CORS preflight failed, etc.)
    throw new ApiError(
      0,
      `Cannot reach the BridgeUp backend at ${baseUrl}. Is it running?`,
      err?.message
    );
  }

  if (!response.ok) {
    let detail = null;
    try {
      const body = await response.json();
      detail = body?.detail ?? body;
    } catch {
      // response body isn't JSON — ignore
    }
    const message =
      typeof detail === 'string'
        ? detail
        : `HTTP ${response.status} ${response.statusText}`;
    throw new ApiError(response.status, message, detail);
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) return null;

  return response.json();
}

// ---------------------------------------------------------------------------
// File upload wrapper (no Content-Type override — browser sets multipart boundary)
// ---------------------------------------------------------------------------

async function apiUpload(path, formData) {
  const baseUrl = PRIMARY_BASE;
  const url = `${baseUrl}${path}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  let response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: formData });
  } catch (err) {
    throw new ApiError(0, `Cannot reach the BridgeUp backend at ${baseUrl}.`, err?.message);
  }

  if (!response.ok) {
    let detail = null;
    try {
      const body = await response.json();
      detail = body?.detail ?? body;
    } catch {/* ignore */}
    const message = typeof detail === 'string' ? detail : `HTTP ${response.status}`;
    throw new ApiError(response.status, message, detail);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Companies  –  GET /companies/   GET /companies/{id}
// ---------------------------------------------------------------------------

export const companiesApi = {
  /** Returns all companies: [{ id, name, created_at }] */
  list: () => apiFetch('/companies/'),

  /** Returns a single company by UUID */
  get: (id) => apiFetch(`/companies/${id}`),
};

// ---------------------------------------------------------------------------
// Experiences  –  GET /experiences/   GET /experiences/{id}
// ---------------------------------------------------------------------------

export const experiencesApi = {
  /**
   * Returns all experiences, optionally filtered by company UUID.
   * @param {string|null} companyId
   */
  list: (companyId = null) => {
    const qs = companyId ? `?company_id=${companyId}` : '';
    return apiFetch(`/experiences/${qs}`);
  },

  /** Returns a single experience by UUID */
  get: (id) => apiFetch(`/experiences/${id}`),
};

// ---------------------------------------------------------------------------
// Questions  –  GET /questions/
// ---------------------------------------------------------------------------

export const questionsApi = {
  /**
   * Returns questions, optionally filtered by experience UUID and/or category.
   * @param {string|null} experienceId
   * @param {string|null} category  One of: DSA, Core, Aptitude, Programming, Project, HR, AI/ML, Other
   */
  list: (experienceId = null, category = null) => {
    const params = new URLSearchParams();
    if (experienceId) params.set('experience_id', experienceId);
    if (category) params.set('category', category);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/questions/${qs}`);
  },

  /** Returns a single question by UUID */
  get: (id) => apiFetch(`/questions/${id}`),
};

// ---------------------------------------------------------------------------
// Advice  –  GET /advice/
// ---------------------------------------------------------------------------

export const adviceApi = {
  /**
   * Returns advice records, optionally filtered by experience UUID and/or type.
   * @param {string|null} experienceId
   * @param {string|null} type  One of: advice, mistake, remember, preparation
   */
  list: (experienceId = null, type = null) => {
    const params = new URLSearchParams();
    if (experienceId) params.set('experience_id', experienceId);
    if (type) params.set('type', type);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/advice/${qs}`);
  },

  /** Returns a single advice record by UUID */
  get: (id) => apiFetch(`/advice/${id}`),
};

// ---------------------------------------------------------------------------
// Resources  –  GET /resources/   GET /resources/{id}
// ---------------------------------------------------------------------------

export const resourcesApi = {
  /** Returns all resources */
  list: () => apiFetch('/resources/'),

  /** Returns a single resource by UUID */
  get: (id) => apiFetch(`/resources/${id}`),
};

// ---------------------------------------------------------------------------
// Auth  –  GET /auth/me
// ---------------------------------------------------------------------------

export const authApi = {
  /**
   * Returns the authenticated user's info from the FastAPI backend.
   * Requires a valid Supabase session to be active.
   * { user_id, email, role, exp, iat }
   */
  me: () => apiFetch('/auth/me'),
};

// ---------------------------------------------------------------------------
// AI (secondary backend)  –  POST /ai/generate-questions
// ---------------------------------------------------------------------------

export const aiApi = {
  /**
   * Generates practice questions using Gemini + real DB data.
   * @param {{ company: string, category: string, count?: number }} payload
   */
  generateQuestions: (payload) =>
    apiFetch('/ai/generate-questions', { method: 'POST', body: JSON.stringify(payload) }, 'ai'),
};

// ---------------------------------------------------------------------------
// Chat (secondary backend)  –  POST /chat
// ---------------------------------------------------------------------------

export const chatApi = {
  /**
   * Sends a message to the BridgeUp "Talk to Me" chat assistant.
   * @param {{ message: string, history?: Array<{role:string, content:string}> }} payload
   */
  send: (payload) =>
    apiFetch('/chat', { method: 'POST', body: JSON.stringify(payload) }, 'ai'),
};

// ---------------------------------------------------------------------------
// Ingestion  –  POST /ingestion/pdfs   GET /ingestion/pdf-status
// ---------------------------------------------------------------------------

export const ingestionApi = {
  /**
   * Upload a PDF experience file. Returns { status, source_file, filename }.
   * @param {File} file
   */
  uploadPdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload('/ingestion/pdfs', formData);
  },

  /**
   * Poll the processing status of an uploaded PDF.
   * @param {string} sourceFile  The source_file value returned by uploadPdf
   */
  pdfStatus: (sourceFile) =>
    apiFetch(`/ingestion/pdf-status?source_file=${encodeURIComponent(sourceFile)}`),
};

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

export const healthApi = {
  check: () => apiFetch('/health'),
};
