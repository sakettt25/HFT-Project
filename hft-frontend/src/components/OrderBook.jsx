// OrderBook.jsx — live order book from WebSocket marketdata channel
import React, { useEffect, useState, useRef } from 'react';
import { wsClient } from '../services/websocket';

const LEVELS = 15;

function LevelRow({ price, qty, total, maxTotal, side, onClick }) {
  const depthPct = Math.min(100, (parseFloat(total) / maxTotal) * 100);
  const isAsk = side === 'ask';

  return (
    <div
      className="ob-row"
      onClick={() => onClick && onClick(price)}
      title={`Click to fill price`}
    >
      <div
        className={`ob-depth-bar ${isAsk ? 'bg-sell' : 'bg-buy'}`}
        style={{ width: `${depthPct}%` }}
      />
      <span className={`ob-cell mono ${isAsk ? 'text-sell' : 'text-buy'}`}>{price}</span>
      <span className="ob-cell mono" style={{ color: 'var(--text-primary)' }}>{qty}</span>
      <span className="ob-cell mono" style={{ color: 'var(--text-secondary)' }}>{total}</span>
    </div>
  );
}

export default function OrderBook({ symbol, onPriceClick }) {
  const [bids, setBids]           = useState([]);
  const [asks, setAsks]           = useState([]);
  const [lastPrice, setLastPrice] = useState(null);
  const [prevPrice, setPrev]      = useState(null);
  const [spread, setSpread]       = useState(null);
  const prevRef = useRef(null);

  useEffect(() => {
    setBids([]);
    setAsks([]);
    setLastPrice(null);
    setPrev(null);
    setSpread(null);

    const unsub = wsClient.on('marketdata', (payload) => {
      const data = payload.data || payload;
      if (data.bids) setBids(data.bids);
      if (data.asks) setAsks(data.asks);
      if (data.lastPrice) {
        const newPrice = parseFloat(data.lastPrice);
        setLastPrice((prev) => {
          setPrev(prev);
          prevRef.current = prev;
          return newPrice;
        });
      }
      // Spread = best ask - best bid
      if (data.asks?.length && data.bids?.length) {
        const bestAsk = parseFloat(data.asks[data.asks.length - 1]?.price ?? 0);
        const bestBid = parseFloat(data.bids[0]?.price ?? 0);
        if (bestAsk > 0 && bestBid > 0) {
          setSpread((bestAsk - bestBid).toFixed(2));
        }
      }
    });

    return () => unsub();
  }, [symbol]);

  const maxTotal = Math.max(
    bids.length > 0 ? parseFloat(bids[bids.length - 1]?.total ?? 0) : 0,
    asks.length > 0 ? parseFloat(asks[0]?.total ?? 0) : 0,
    1
  );

  const priceUp   = lastPrice != null && prevPrice != null && lastPrice > prevPrice;
  const priceDown = lastPrice != null && prevPrice != null && lastPrice < prevPrice;

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header" style={{ justifyContent: 'space-between' }}>
        <span>Order Book</span>
        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          {symbol}
        </span>
      </div>

      <div className="panel-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Column headers */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '6px 16px', fontSize: '0.72rem', color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <span>PRICE</span>
          <span>QTY</span>
          <span>TOTAL</span>
        </div>

        {/* Asks — top, red, reversed so best ask is closest to spread */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 16px' }}>
          {asks.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No ask data
            </div>
          ) : (
            asks.map((ask, i) => (
              <LevelRow
                key={i} side="ask"
                price={ask.price} qty={ask.qty} total={ask.total}
                maxTotal={maxTotal}
                onClick={onPriceClick}
              />
            ))
          )}
        </div>

        {/* Spread / last price */}
        <div className="ob-spread">
          <span
            className="mono"
            style={{
              color: priceUp
                ? 'var(--accent-buy)'
                : priceDown
                ? 'var(--accent-sell)'
                : 'var(--text-primary)',
              transition: 'color 0.4s ease',
            }}
          >
            {lastPrice != null
              ? lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '—'}
          </span>
          {spread && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Spread: {spread}
            </span>
          )}
        </div>

        {/* Bids — bottom, green */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {bids.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No bid data
            </div>
          ) : (
            bids.slice(0, LEVELS).map((bid, i) => (
              <LevelRow
                key={i} side="bid"
                price={bid.price} qty={bid.qty} total={bid.total}
                maxTotal={maxTotal}
                onClick={onPriceClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
