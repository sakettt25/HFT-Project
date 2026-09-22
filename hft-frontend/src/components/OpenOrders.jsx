// OpenOrders.jsx — live open orders from backend REST, updated via WebSocket
import React, { useEffect, useState, useCallback } from 'react';
import { OrderService } from '../services/api';
import { wsClient } from '../services/websocket';
import { XCircle, RefreshCw, Loader } from 'lucide-react';

const STATUS_COLORS = {
  NEW:              'var(--accent-primary)',
  PARTIALLY_FILLED: '#f59e0b',
  FILLED:           'var(--accent-buy)',
  CANCELLED:        'var(--text-muted)',
  REJECTED:         'var(--accent-sell)',
  PENDING_NEW:      'var(--text-secondary)',
};

function FillBar({ filled, qty }) {
  const pct = qty > 0 ? Math.min(100, (filled / qty) * 100) : 0;
  if (pct === 0) return null;
  return (
    <div style={{ width: '48px', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-buy)', transition: 'width 0.4s ease' }} />
    </div>
  );
}

export default function OpenOrders({ symbol, toast }) {
  const [orders,  setOrders]   = useState([]);
  const [loading, setLoading]  = useState(true);
  const [cancelling, setCancelling] = useState(new Set());

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await OrderService.getOpenOrders(symbol);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast?.error(`Failed to load orders: ${err.message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [symbol, toast]);

  useEffect(() => {
    fetchOrders();
    const unsub = wsClient.on('orders', () => fetchOrders());
    return () => unsub();
  }, [fetchOrders]);

  const handleCancel = async (orderId) => {
    setCancelling((prev) => new Set([...prev, orderId]));
    try {
      await OrderService.cancelOrder(orderId);
      toast?.success(`Order ${orderId.slice(-8)} cancelled`);
      fetchOrders();
    } catch (err) {
      toast?.error(`Cancel failed: ${err.message}`);
    } finally {
      setCancelling((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleCancelAll = async () => {
    try {
      const res = await OrderService.cancelAllOrders(symbol);
      toast?.success(`Cancelled ${Array.isArray(res) ? res.length : 0} orders`);
      fetchOrders();
    } catch (err) {
      toast?.error(`Cancel all failed: ${err.message}`);
    }
  };

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header" style={{ justifyContent: 'space-between' }}>
        <span>Open Orders</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={fetchOrders}
            title="Refresh"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
          >
            <RefreshCw size={13} />
          </button>
          {orders.length > 0 && (
            <button
              onClick={handleCancelAll}
              style={{
                background: 'var(--accent-sell-dim)',
                border: '1px solid var(--accent-sell)',
                color: 'var(--accent-sell)',
                padding: '2px 10px', borderRadius: '4px',
                fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600,
              }}
            >
              CANCEL ALL
            </button>
          )}
        </div>
      </div>

      <div className="panel-content" style={{ padding: 0 }}>
        {loading && orders.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', gap: '8px', color: 'var(--text-muted)' }}>
            <Loader size={16} className="spin" />
            <span style={{ fontSize: '0.8rem' }}>Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            No open orders for {symbol}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>SIDE</th>
                <th>TYPE</th>
                <th>PRICE</th>
                <th>QTY</th>
                <th>FILLED</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const qty    = parseFloat(order.quantity ?? 0);
                const filled = parseFloat(order.filledQuantity ?? 0);
                const isCancelling = cancelling.has(order.orderId);

                return (
                  <tr key={order.orderId} className="data-row">
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '—'}
                    </td>
                    <td className={order.side === 'BUY' ? 'text-buy' : 'text-sell'} style={{ fontWeight: 700 }}>
                      {order.side}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {order.orderType}
                    </td>
                    <td className="mono">
                      {order.orderType === 'MARKET'
                        ? <span style={{ color: 'var(--text-muted)' }}>MKT</span>
                        : parseFloat(order.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      }
                    </td>
                    <td className="mono">{qty.toFixed(4)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>{filled.toFixed(4)}</span>
                        <FillBar filled={filled} qty={qty} />
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 7px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600,
                        background: 'var(--bg-tertiary)',
                        color: STATUS_COLORS[order.status] ?? 'var(--text-secondary)',
                        border: `1px solid ${STATUS_COLORS[order.status] ?? 'var(--border-color)'}`,
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleCancel(order.orderId)}
                        disabled={isCancelling}
                        style={{
                          background: 'none', border: 'none',
                          color: isCancelling ? 'var(--text-muted)' : 'var(--accent-sell)',
                          cursor: isCancelling ? 'not-allowed' : 'pointer',
                          padding: '2px',
                        }}
                        title="Cancel Order"
                      >
                        {isCancelling ? <Loader size={14} className="spin" /> : <XCircle size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
