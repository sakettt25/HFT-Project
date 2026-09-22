// PositionPanel.jsx — live position & unrealized P&L from /api/v1/account/positions
import React, { useEffect, useState, useCallback } from 'react';
import { AccountService } from '../services/api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const POLL_MS = 4000;

function fmt(val, decimals = 4) {
  if (val == null) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtUsd(val) {
  if (val == null) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  const abs = Math.abs(n);
  return (n < 0 ? '-' : '+') + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PositionPanel({ symbol }) {
  const [position, setPosition] = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchPosition = useCallback(async () => {
    try {
      const data = await AccountService.getPositions(symbol);
      if (Array.isArray(data) && data.length > 0) {
        setPosition(data[0]);
      }
    } catch {
      // backend might not be up
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    setLoading(true);
    fetchPosition();
    const id = setInterval(fetchPosition, POLL_MS);
    return () => clearInterval(id);
  }, [fetchPosition]);

  const qty = parseFloat(position?.quantity ?? 0);
  const isFlat = qty === 0;
  const isLong = qty > 0;
  const unrealizedPnl = parseFloat(position?.unrealizedPnl ?? 0);
  const pnlPositive = unrealizedPnl >= 0;

  const DirectionIcon = isFlat
    ? Minus
    : isLong
    ? TrendingUp
    : TrendingDown;

  const directionColor = isFlat
    ? 'var(--text-secondary)'
    : isLong
    ? 'var(--accent-buy)'
    : 'var(--accent-sell)';

  return (
    <div className="panel">
      <div className="panel-header">Position — {symbol}</div>
      <div className="panel-content">
        {loading ? (
          <div className="skeleton-block" style={{ height: '80px' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Direction badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: isFlat ? 'var(--bg-tertiary)' : isLong ? 'var(--accent-buy-dim)' : 'var(--accent-sell-dim)',
                border: `1px solid ${directionColor}`,
                borderRadius: '6px', padding: '4px 12px',
              }}>
                <DirectionIcon size={14} color={directionColor} />
                <span className="mono" style={{ fontWeight: 700, color: directionColor, fontSize: '0.85rem' }}>
                  {position?.direction ?? 'FLAT'}
                </span>
              </div>
            </div>

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="stat-row">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quantity</span>
                <span className="mono" style={{ color: directionColor, fontWeight: 600, fontSize: '0.9rem' }}>
                  {isFlat ? '0.0000' : fmt(Math.abs(qty))}
                </span>
              </div>
              <div className="stat-row">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg Entry</span>
                <span className="mono" style={{ fontSize: '0.9rem' }}>
                  {fmt(position?.averageEntryPrice, 2)}
                </span>
              </div>
              <div className="stat-row">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mark Price</span>
                <span className="mono" style={{ fontSize: '0.9rem' }}>
                  {fmt(position?.markPrice, 2)}
                </span>
              </div>
              <div className="stat-row">
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Notional</span>
                <span className="mono" style={{ fontSize: '0.9rem' }}>
                  ${fmt(position?.notionalValue, 2)}
                </span>
              </div>
            </div>

            {/* P&L Row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: pnlPositive ? 'var(--accent-buy-dim)' : 'var(--accent-sell-dim)',
              border: `1px solid ${pnlPositive ? 'var(--accent-buy)' : 'var(--accent-sell)'}`,
              borderRadius: '6px', padding: '10px 14px',
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Unrealized P&L</div>
                <div className="mono" style={{ fontWeight: 700, color: pnlPositive ? 'var(--accent-buy)' : 'var(--accent-sell)', fontSize: '1rem' }}>
                  {fmtUsd(position?.unrealizedPnl)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Pct</div>
                <div className="mono" style={{ fontWeight: 600, color: pnlPositive ? 'var(--accent-buy)' : 'var(--accent-sell)', fontSize: '0.85rem' }}>
                  {position?.unrealizedPnlPct != null
                    ? `${pnlPositive ? '+' : ''}${parseFloat(position.unrealizedPnlPct).toFixed(2)}%`
                    : '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <span>Realized P&L: <span className="mono" style={{ color: parseFloat(position?.realizedPnl ?? 0) >= 0 ? 'var(--accent-buy)' : 'var(--accent-sell)' }}>
                {fmtUsd(position?.realizedPnl)}
              </span></span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

