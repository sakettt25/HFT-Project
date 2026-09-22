// RecentTrades.jsx — live trade feed from WebSocket
import React, { useEffect, useState, useRef } from 'react';
import { wsClient } from '../services/websocket';

const MAX_TRADES = 60;

function fmt(val, d = 2) {
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function toTime(ts) {
  if (!ts) return new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  // ts may be epoch nanos, epoch ms, or ISO string
  let ms = ts;
  if (typeof ts === 'number') {
    if (ts > 1e12) ms = ts / 1e6; // nanos → ms
    else if (ts > 1e9)  ms = ts * 1000; // sec → ms (already ms if > 1e12)
  }
  return new Date(ms).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function RecentTrades({ symbol }) {
  const [trades, setTrades] = useState([]);
  const [newIds, setNewIds]  = useState(new Set());
  const latestRef = useRef(new Set());

  useEffect(() => {
    setTrades([]);
    setNewIds(new Set());
    latestRef.current = new Set();

    const unsub = wsClient.on('trades', (payload) => {
      const t = payload.data || payload;

      const trade = {
        id:    t.tradeId || t.id || `T${Date.now()}`,
        price: fmt(t.price, 2),
        qty:   fmt(t.quantity ?? t.qty, 4),
        time:  toTime(t.executedAt ?? t.timestamp),
        isBuy: t.side === 'BUY' || t.aggressorSide === 'BUY',
      };

      setTrades((prev) => {
        const next = [trade, ...prev];
        return next.length > MAX_TRADES ? next.slice(0, MAX_TRADES) : next;
      });

      // Flash animation for new row
      const id = trade.id;
      setNewIds((prev) => new Set([...prev, id]));
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 700);
    });

    return () => unsub();
  }, [symbol]);

  return (
    <div className="panel" style={{ flex: 1 }}>
      <div className="panel-header" style={{ justifyContent: 'space-between' }}>
        <span>Recent Trades</span>
        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {trades.length} / {MAX_TRADES}
        </span>
      </div>
      <div className="panel-content" style={{ padding: 0 }}>
        {trades.length === 0 ? (
          <div style={{
            padding: '32px 16px', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: '0.8rem',
          }}>
            Waiting for trades…<br />
            <span style={{ fontSize: '0.72rem' }}>Submit orders to see live fills</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>PRICE</th>
                <th>QTY</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr
                  key={trade.id}
                  className={`data-row ${newIds.has(trade.id) ? (trade.isBuy ? 'flash-up' : 'flash-down') : ''}`}
                >
                  <td style={{ color: 'var(--text-secondary)' }}>{trade.time}</td>
                  <td className={trade.isBuy ? 'text-buy' : 'text-sell'}>
                    {trade.isBuy ? '▲' : '▼'} {trade.price}
                  </td>
                  <td style={{ color: 'var(--text-primary)' }}>{trade.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
