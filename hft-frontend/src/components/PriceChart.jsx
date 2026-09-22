// PriceChart.jsx — live SVG sparkline from real-time price data via WebSocket
import React, { useEffect, useRef, useState } from 'react';
import { wsClient } from '../services/websocket';
import { Activity } from 'lucide-react';

const MAX_POINTS = 120; // keep last 120 price ticks

function buildPath(points, w, h, pad = 12) {
  if (points.length < 2) return '';
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const xScale = (i) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const yScale = (v) => h - pad - ((v - min) / range) * (h - pad * 2);

  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(2)},${yScale(p.price).toFixed(2)}`)
    .join(' ');
}

function buildArea(points, w, h, pad = 12) {
  if (points.length < 2) return '';
  const path = buildPath(points, w, h, pad);
  const lastX = (pad + ((points.length - 1) / (points.length - 1)) * (w - pad * 2)).toFixed(2);
  return `${path} L${lastX},${h - pad} L${pad},${h - pad} Z`;
}

export default function PriceChart({ symbol }) {
  const [points, setPoints] = useState([]);
  const svgRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 180 });

  // Observe container size
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width || 600, h: Math.max(150, entry.contentRect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Subscribe to live market data
  useEffect(() => {
    setPoints([]); // clear on symbol change

    const unsub = wsClient.on('marketdata', (payload) => {
      const data = payload.data || payload;
      const price = parseFloat(data.lastPrice);
      if (!isNaN(price) && price > 0) {
        setPoints((prev) => {
          const next = [...prev, { price, ts: Date.now() }];
          return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
        });
      }
    });

    return () => unsub();
  }, [symbol]);

  const isUp = points.length >= 2
    ? points[points.length - 1].price >= points[0].price
    : true;

  const strokeColor = isUp ? 'var(--accent-buy)' : 'var(--accent-sell)';
  const { w, h } = size;

  const lastPrice = points.length > 0 ? points[points.length - 1].price : null;
  const firstPrice = points.length > 0 ? points[0].price : null;
  const changePct = lastPrice && firstPrice
    ? (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2)
    : null;

  return (
    <div className="panel" style={{ flex: 1, minHeight: 0 }}>
      <div className="panel-header" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} />
          PRICE CHART — {symbol}
        </span>
        {lastPrice && (
          <span className="mono" style={{ fontSize: '0.85rem', color: isUp ? 'var(--accent-buy)' : 'var(--accent-sell)' }}>
            {lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {changePct && (
              <span style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                ({isUp ? '+' : ''}{changePct}%)
              </span>
            )}
          </span>
        )}
      </div>
      <div className="panel-content" style={{ padding: 0, position: 'relative', overflow: 'hidden' }} ref={svgRef}>
        {points.length < 2 ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100%', flexDirection: 'column', gap: '8px', opacity: 0.4,
          }}>
            <Activity size={40} color="var(--text-muted)" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Waiting for live price data…
            </p>
          </div>
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            <defs>
              <linearGradient id={`chartGrad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <path
              d={buildArea(points, w, h)}
              fill={`url(#chartGrad-${symbol})`}
            />
            {/* Line */}
            <path
              d={buildPath(points, w, h)}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Last price dot */}
            {(() => {
              const i = points.length - 1;
              const prices = points.map((p) => p.price);
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const range = max - min || 1;
              const pad = 12;
              const x = pad + (i / (points.length - 1)) * (w - pad * 2);
              const y = h - pad - ((points[i].price - min) / range) * (h - pad * 2);
              return (
                <circle cx={x} cy={y} r={4} fill={strokeColor} />
              );
            })()}
          </svg>
        )}
      </div>
    </div>
  );
}

