/**
 * Base API client.
 * All requests go to VITE_API_URL (the FastAPI backend).
 * Throws a plain Error with a user-friendly message on failure.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * @param {string} path   - e.g. '/companies' or '/experiences/uuid'
 * @param {RequestInit}   - optional fetch options
 * @returns {Promise<any>} - parsed JSON
 */
export async function apiFetch(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    // Network-level failure (backend not running, CORS preflight blocked, etc.)
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body.detail) detail = body.detail;
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(detail);
  }

  return response.json();
}
