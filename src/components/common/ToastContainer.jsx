import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
  warning: 'var(--color-warning)',
  info: 'var(--color-primary)',
};

export default function ToastContainer() {
  const { state, dispatch } = useApp();
  const { toast } = state;
  if (!toast) return null;

  const Icon = ICONS[toast.type] || Info;
  const color = COLORS[toast.type] || COLORS.info;

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      <div className={`toast toast-${toast.type}`}>
        <Icon size={18} style={{ color, flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1 }}>
          {toast.title && <div style={{ fontWeight: 600, marginBottom: '0.15rem', color: 'var(--color-text)' }}>{toast.title}</div>}
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{toast.message}</div>
        </div>
        <button
          onClick={() => dispatch({ type: 'HIDE_TOAST' })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-muted)', flexShrink: 0 }}
          aria-label="Dismiss notification"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
