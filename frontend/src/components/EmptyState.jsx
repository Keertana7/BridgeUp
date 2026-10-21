import './EmptyState.css';

/**
 * @param {{ icon?: string, title?: string, message?: string }} props
 */
export default function EmptyState({
  icon = '📭',
  title = 'Nothing here yet',
  message = 'No data was found.',
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <p className="empty-title">{title}</p>
      <p className="empty-message">{message}</p>
    </div>
  );
}
