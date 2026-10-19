export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="state-box">
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
      <h3>Something went wrong</h3>
      <p style={{ marginTop: '0.5rem', color: '#85818D' }}>{message}</p>
      {onRetry && (
        <button
          className="btn-primary"
          onClick={onRetry}
          style={{ marginTop: '1.25rem' }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
