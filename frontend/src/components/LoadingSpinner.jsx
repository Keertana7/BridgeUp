import './LoadingSpinner.css';

/**
 * Full-section loading spinner.
 * @param {{ message?: string }} props
 */
export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="spinner-container" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="spinner-message">{message}</p>
    </div>
  );
}
