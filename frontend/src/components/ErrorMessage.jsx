import './ErrorMessage.css';
import { ApiError } from '../api/client';

/**
 * Displays an API error with enough detail to diagnose the problem.
 *
 * @param {{ error: ApiError|Error|string, onRetry?: () => void }} props
 */
export default function ErrorMessage({ error, onRetry }) {
  let title = 'Something went wrong';
  let body = 'An unexpected error occurred.';

  if (error instanceof ApiError) {
    if (error.status === 0) {
      title = 'Cannot reach the backend';
      body = error.message;
    } else if (error.status === 401 || error.status === 403) {
      title = 'Authentication required';
      body = 'Please sign in to view this content.';
    } else if (error.status === 404) {
      title = 'Not found';
      body = error.message;
    } else {
      title = `Error ${error.status}`;
      body = error.message;
    }
  } else if (typeof error === 'string') {
    body = error;
  } else if (error?.message) {
    body = error.message;
  }

  return (
    <div className="error-box" role="alert">
      <span className="error-icon" aria-hidden="true">⚠️</span>
      <div className="error-content">
        <p className="error-title">{title}</p>
        <p className="error-body">{body}</p>
      </div>
      {onRetry && (
        <button className="error-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
