// OrderEntry.jsx — fully wired order form
import React, { useState, useCallback } from 'react';
import { OrderService } from '../services/api';
import { Zap, Info } from 'lucide-react';

const SYMBOLS_BASE = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  BNBUSDT: 'BNB',
  XRPUSDT: 'XRP',
};

const QTY_PCTS = [25, 50, 75, 100];

export default function OrderEntry({ symbol, toast }) {
  const [side, setSide]         = useState('BUY');
  const [orderType, setType]    = useState('LIMIT');
  const [price, setPrice]       = useState('');
  const [quantity, setQty]      = useState('');
  const [tif, setTif]           = useState('GTC');
  const [submitting, setSubmit] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const base = SYMBOLS_BASE[symbol] ?? symbol.replace('USDT', '');
  const isMarket = orderType === 'MARKET';
  const total = (!isMarket && price && quantity)
    ? (parseFloat(price) * parseFloat(quantity)).toFixed(2)
    : null;

  const handleQtyPct = (pct) => {
    // Without a real balance endpoint we just show proportional qty example
    // In production this would divide balance / price
    const base = 1.0; // 1 unit as 100%
    setQty(((pct / 100) * base).toFixed(4));
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const qty = parseFloat(quantity);
    const px  = isMarket ? 0 : parseFloat(price);

    if (isNaN(qty) || qty <= 0) {
      toast?.error('Quantity must be a positive number');
      return;
    }
    if (!isMarket && (isNaN(px) || px <= 0)) {
      toast?.error('Price must be a positive number for LIMIT orders');
      return;
    }

    setSubmit(true);
    try {
      const order = {
        symbol,
        side,
        orderType,
        price: isMarket ? null : px,
        quantity: qty,
        timeInForce: tif,
        account: 'DEFAULT',
      };

      const res = await OrderService.submitOrder(order);

      if (res.status === 'REJECTED') {
        toast?.error(`Order rejected: ${res.errorMessage}`);
      } else {
        setLastOrder(res);
        toast?.success(
          `${side} ${qty} ${base} — ${res.status} (ID: ${res.orderId?.slice(-8) ?? '?'})`
        );
        // Reset qty but keep price
        setQty('');
      }
    } catch (err) {
      toast?.error(err.message ?? 'Failed to submit order');
    } finally {
      setSubmit(false);
    }
  }, [symbol, side, orderType, price, quantity, tif, isMarket, base, toast]);

  return (
    <div className="panel">
      <div className="panel-header">
        <Zap size={14} />
        Place Order
      </div>
      <div className="panel-content">

        {/* Buy / Sell toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['BUY', 'SELL'].map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              style={{
                flex: 1, padding: '10px', borderRadius: '6px', border: 'none',
                fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.5px',
                cursor: 'pointer', transition: 'all 0.15s ease',
                background: side === s
                  ? (s === 'BUY' ? 'var(--accent-buy)' : 'var(--accent-sell)')
                  : 'var(--bg-tertiary)',
                color: side === s
                  ? (s === 'BUY' ? '#000' : '#fff')
                  : 'var(--text-secondary)',
                boxShadow: side === s
                  ? (s === 'BUY' ? 'var(--shadow-glow-buy)' : 'var(--shadow-glow-sell)')
                  : 'none',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Order Type */}
          <div className="form-group">
            <label className="form-label">Order Type</label>
            <select className="form-select" value={orderType} onChange={(e) => setType(e.target.value)}>
              <option value="LIMIT">Limit</option>
              <option value="MARKET">Market</option>
            </select>
          </div>

          {/* Price */}
          <div className="form-group">
            <label className="form-label">Price (USDT)</label>
            <input
              type="number" step="0.01" min="0"
              className="form-input"
              placeholder={isMarket ? 'Market Price' : '0.00'}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isMarket}
            />
          </div>

          {/* Quantity */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Quantity ({base})</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {QTY_PCTS.map((pct) => (
                  <button
                    key={pct} type="button"
                    onClick={() => handleQtyPct(pct)}
                    style={{
                      fontSize: '0.65rem', padding: '2px 5px',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                      borderRadius: '3px', color: 'var(--text-secondary)', cursor: 'pointer',
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number" step="0.0001" min="0"
              className="form-input"
              placeholder="0.0000"
              value={quantity}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          {/* Time in Force */}
          <div className="form-group">
            <label className="form-label">Time in Force</label>
            <select className="form-select" value={tif} onChange={(e) => setTif(e.target.value)}>
              <option value="GTC">GTC — Good Till Cancel</option>
              <option value="IOC">IOC — Immediate or Cancel</option>
              <option value="FOK">FOK — Fill or Kill</option>
            </select>
          </div>

          {/* Estimated total */}
          {total && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              background: 'var(--bg-tertiary)', borderRadius: '6px',
              padding: '8px 12px', marginBottom: '16px',
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Est. Total</span>
              <span className="mono" style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                ${parseFloat(total).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={`btn ${side === 'BUY' ? 'btn-buy' : 'btn-sell'}`}
            disabled={submitting}
          >
            {submitting ? 'SUBMITTING…' : `${side} ${base}`}
          </button>
        </form>

        {/* Last order summary */}
        {lastOrder && (
          <div style={{
            marginTop: '14px',
            background: 'var(--bg-tertiary)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Last Order</span>
              <span className="mono" style={{ color: 'var(--text-primary)' }}>{lastOrder.orderId?.slice(-12)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>Status</span>
              <span className="mono" style={{
                color: lastOrder.status === 'NEW' || lastOrder.status === 'FILLED'
                  ? 'var(--accent-buy)' : 'var(--text-secondary)',
              }}>
                {lastOrder.status}
              </span>
            </div>
            {lastOrder.submitLatencyUs && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={10} /> Latency
                </span>
                <span className="mono">{lastOrder.submitLatencyUs}µs</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
