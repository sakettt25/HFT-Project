// StatCard.jsx — reusable metric card
import React from 'react';

/**
 * @param {string} label  - small uppercase label
 * @param {string|number} value  - main displayed value
 * @param {string} [sub]  - secondary line (e.g. change pct)
 * @param {'buy'|'sell'|'neutral'} [variant] - color scheme
 * @param {React.ReactNode} [icon]
 */
export default function StatCard({ label, value, sub, variant = 'neutral', icon }) {
  const color =
    variant === 'buy'
      ? 'var(--accent-buy)'
      : variant === 'sell'
      ? 'var(--accent-sell)'
      : 'var(--text-primary)';

  return (
    <div className="stat-card">
      <span className="stat-label">
        {icon && <span className="stat-icon">{icon}</span>}
        {label}
      </span>
      <span className="mono stat-value" style={{ color }}>
        {value ?? '—'}
      </span>
      {sub && (
        <span className="stat-sub">{sub}</span>
      )}
    </div>
  );
}

