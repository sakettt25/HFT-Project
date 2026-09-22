import React, { useEffect, useState } from 'react';
import { MarketService } from '../services/api';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT', icon: '₿', name: 'Bitcoin' },
  { value: 'ETHUSDT', label: 'ETH/USDT', icon: 'Ξ', name: 'Ethereum' },
  { value: 'SOLUSDT', label: 'SOL/USDT', icon: '◎', name: 'Solana' },
  { value: 'BNBUSDT', label: 'BNB/USDT', icon: '◆', name: 'Binance Coin' },
  { value: 'XRPUSDT', label: 'XRP/USDT', icon: '✕', name: 'Ripple' },
];

function fmt(val, decimals = 2) {
  if (val == null) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function MarketsView({ onSelectSymbol }) {
  const [marketStats, setMarketStats] = useState({});

  useEffect(() => {
    const fetchAllMarkets = async () => {
      try {
        const data = await MarketService.getStats(); // Get all symbols
        const statsMap = {};
        if (Array.isArray(data)) {
          data.forEach(stat => {
            statsMap[stat.symbol] = stat;
          });
        }
        setMarketStats(statsMap);
      } catch (err) {
        console.error('Failed to fetch market stats', err);
      }
    };

    fetchAllMarkets();
    const interval = setInterval(fetchAllMarkets, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="markets-view">
      <div className="markets-header">
        <h2 className="markets-title">Markets Overview</h2>
        <p className="markets-subtitle">Real-time cryptocurrency market data</p>
      </div>
      
      {/* Table Header */}
      <div className="markets-table-header">
        <div className="markets-table-header-cell">Pair</div>
        <div className="markets-table-header-cell">Price / Change</div>
        <div className="markets-table-header-cell"></div>
        <div className="markets-table-header-cell">24h High</div>
        <div className="markets-table-header-cell">24h Low</div>
        <div className="markets-table-header-cell">24h Volume</div>
      </div>
      
      <div className="markets-grid">
        {SYMBOLS.map((s) => {
          const stats = marketStats[s.value];
          const isPositive = stats ? parseFloat(stats.priceChangePct24h) >= 0 : null;
          
          return (
            <div 
              key={s.value} 
              className="market-card" 
              onClick={() => onSelectSymbol(s.value)}
            >
              <div className="market-card-header">
                <span className="market-icon">{s.icon}</span>
                <div>
                  <div className="market-symbol">{s.label}</div>
                  <div className="market-name">{s.name}</div>
                </div>
              </div>
              
              <div className="market-card-body">
                <div className="market-price">
                  ${stats ? fmt(stats.lastPrice) : 'Loading...'}
                </div>
                {stats && (
                  <div 
                    className="market-change" 
                    style={{ 
                      color: isPositive ? 'var(--accent-buy)' : 'var(--accent-sell)',
                      background: isPositive ? 'rgba(0, 217, 126, 0.1)' : 'rgba(240, 71, 71, 0.1)',
                    }}
                  >
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>
                      {isPositive ? '+' : ''}{fmt(stats.priceChangePct24h, 2)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div></div>
              
              <div className="market-card-footer">
                <div className="market-stat-row">
                  <span className="market-stat-label">High</span>
                  <span className="market-stat-value" style={{ color: 'var(--accent-buy)' }}>
                    ${stats ? fmt(stats.high24h) : '—'}
                  </span>
                </div>
                
                <div className="market-stat-row">
                  <span className="market-stat-label">Low</span>
                  <span className="market-stat-value" style={{ color: 'var(--accent-sell)' }}>
                    ${stats ? fmt(stats.low24h) : '—'}
                  </span>
                </div>
                
                <div className="market-stat-row">
                  <span className="market-stat-label">Volume</span>
                  <span className="market-stat-value">
                    {stats ? fmt(stats.volume24h, 2) : '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
