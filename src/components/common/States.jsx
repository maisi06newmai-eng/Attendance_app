import React from 'react';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={26} />
        </div>
      )}
      <div className="empty-state-title">{title}</div>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
    </div>
  );
}

export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div className="loading-spinner" />
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{message}</span>
      </div>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ background: 'var(--color-error-bg)', color: 'var(--color-error)' }}>
        <span style={{ fontSize: '1.5rem' }}>⚠</span>
      </div>
      <div className="empty-state-title">Error</div>
      <p className="empty-state-desc">{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry} style={{ marginTop: '1rem' }}>
          Try Again
        </button>
      )}
    </div>
  );
}
