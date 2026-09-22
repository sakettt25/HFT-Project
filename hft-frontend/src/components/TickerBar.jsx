// TickerBar.jsx — live 24h market stats bar, data from backend /api/v1/market/stats
import React, { useEffect, useState, useCallback } from 'react';
import { MarketService } from '../services/api';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const POLL_INTERVAL_MS = 5000; // refresh every 5 s

function fmt(val, decimals = 2) {
  if (val == null) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Inline StatCard component
function StatCard({ label, value, sub, variant = 'neutral', icon }) {
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

export default function TickerBar({ symbol }) {
  const [stats, setStats] = useState(null);
  const [prevPrice, setPrevPrice] = useState(null);
  const [flash, setFlash] = useState(null); // 'up' | 'down' | null

  const fetchStats = useCallback(async () => {
    try {
      const data = await MarketService.getStats(symbol);
      if (Array.isArray(data) && data.length > 0) {
        const s = data.find((d) => d.symbol === symbol) || data[0];
        setStats((prev) => {
          if (prev && s.lastPrice !== prev.lastPrice) {
            setFlash(parseFloat(s.lastPrice) > parseFloat(prev.lastPrice) ? 'up' : 'down');
            setPrevPrice(prev.lastPrice);
            setTimeout(() => setFlash(null), 600);
          }
          return s;
        });
      }
    } catch {
      // silently fail — backend might not be running yet
    }
  }, [symbol]);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchStats]);

  const isPositive = stats ? parseFloat(stats.priceChangePct24h) >= 0 : null;
  const priceColor =
    flash === 'up' ? 'var(--accent-buy)' :
    flash === 'down' ? 'var(--accent-sell)' :
    isPositive === true ? 'var(--accent-buy)' :
    isPositive === false ? 'var(--accent-sell)' :
    'var(--text-primary)';

  return (
    <div className="ticker-bar">
      {/* Symbol + last price */}
      <div className="ticker-price-section">
        <div>
          <div className="ticker-symbol-label">{symbol}</div>
          <div
            className="mono ticker-price-value"
            style={{
              color: priceColor,
              transition: 'color 0.3s ease',
            }}
          >
            {stats ? fmt(stats.lastPrice) : '—'}
          </div>
        </div>
        {stats && isPositive !== null && (
          <div className="ticker-trend-icon" style={{ color: isPositive ? 'var(--accent-buy)' : 'var(--accent-sell)' }}>
            {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
        )}
      </div>

      <StatCard
        label="24h Change"
        value={stats ? `${isPositive ? '+' : ''}${fmt(stats.priceChangePct24h, 2)}%` : '—'}
        sub={stats ? `${isPositive ? '+' : ''}${fmt(stats.priceChange24h)}` : undefined}
        variant={isPositive === true ? 'buy' : isPositive === false ? 'sell' : 'neutral'}
      />
      <StatCard label="24h High" value={stats ? fmt(stats.high24h) : '—'} variant="buy" />
      <StatCard label="24h Low"  value={stats ? fmt(stats.low24h)  : '—'} variant="sell" />
      <StatCard label="24h Vol"  value={stats ? fmt(stats.volume24h, 4) : '—'} />
      <StatCard label="Best Bid" value={stats ? fmt(stats.bestBid) : '—'} variant="buy" />
      <StatCard label="Best Ask" value={stats ? fmt(stats.bestAsk) : '—'} variant="sell" />
      <StatCard
        label="Spread"
        value={stats ? fmt(stats.spread) : '—'}
        sub={stats ? `${fmt(stats.spreadPct, 4)}%` : undefined}
      />
      <StatCard label="Open Orders" value={stats?.openOrders ?? '—'} icon={<Activity size={12} />} />
    </div>
  );
}

