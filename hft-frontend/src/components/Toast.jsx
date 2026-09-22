// Toast.jsx — renders the toast stack in a fixed portal
import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} />,
  error:   <XCircle size={16} />,
  warning: <AlertCircle size={16} />,
  info:    <Info size={16} />,
};

const colors = {
  success: { border: 'var(--accent-buy)',  icon: 'var(--accent-buy)' },
  error:   { border: 'var(--accent-sell)', icon: 'var(--accent-sell)' },
  warning: { border: '#f59e0b',            icon: '#f59e0b' },
  info:    { border: 'var(--accent-primary)', icon: 'var(--accent-primary)' },
};

export default function Toast({ toasts, dismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '360px',
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => {
        const c = colors[t.type] || colors.info;
        return (
          <div
            key={t.id}
            className="toast-enter"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: 'var(--bg-secondary)',
              border: `1px solid ${c.border}`,
              borderLeft: `4px solid ${c.border}`,
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-lg)',
              pointerEvents: 'all',
              minWidth: '260px',
            }}
          >
            <span style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }}>
              {icons[t.type]}
            </span>
            <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

