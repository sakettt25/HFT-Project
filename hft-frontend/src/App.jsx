import React, { useEffect, useState } from 'react';
import {
  Activity,
  Wifi,
  RefreshCw,
  Home,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { wsClient } from './services/websocket';
import { useToast } from './hooks/useToast';
import Toast from './components/Toast';
import TickerBar from './components/TickerBar';
import OrderBook from './components/OrderBook';
import OrderEntry from './components/OrderEntry';
import RecentTrades from './components/RecentTrades';
import OpenOrders from './components/OpenOrders';
import PriceChart from './components/PriceChart';
import PositionPanel from './components/PositionPanel';
import LandingPage from './pages/LandingPage';
import MarketsView from './components/MarketsView';
import './TradingTerminal.css';

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT', icon: '₿' },
  { value: 'ETHUSDT', label: 'ETH/USDT', icon: 'Ξ' },
  { value: 'SOLUSDT', label: 'SOL/USDT', icon: '◎' },
  { value: 'BNBUSDT', label: 'BNB/USDT', icon: '◆' },
  { value: 'XRPUSDT', label: 'XRP/USDT', icon: '✕' },
];

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [currentView, setCurrentView] = useState('trading'); // 'trading' or 'markets'
  const [isConnected, setConnected] = useState(false);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [fillPrice, setFillPrice] = useState('');
  const { toasts, toast } = useToast();

  useEffect(() => {
    wsClient.connect();

    const unsubConn = wsClient.on('connection', (status) => {
      setConnected(status);
      if (status) {
        wsClient.subscribe('marketdata', symbol);
        wsClient.subscribe('orders', 'DEFAULT');
        wsClient.subscribe('trades', 'DEFAULT');
      }
    });

    return () => {
      unsubConn();
      wsClient.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      wsClient.subscribe('marketdata', symbol);
    }
  }, [symbol, isConnected]);

  const handleSymbolChange = (newSymbol) => {
    setSymbol(newSymbol);
    setFillPrice('');
  };

  const handleReconnect = () => {
    wsClient.connect();
    toast.info('Attempting reconnect…');
  };

  const handleEnterApp = () => {
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  const currentSymbol = SYMBOLS.find((s) => s.value === symbol) || SYMBOLS[0];

  return (
    <>
      <div className="trading-terminal">
        {/* Professional Navbar */}
        <nav className="terminal-navbar">
          <div className="navbar-left">
            <div className="navbar-brand">
              <Activity size={28} strokeWidth={2.5} />
              <div className="brand-text">
                <span className="brand-name">CRYPTO<span className="brand-accent">HFT</span></span>
                <span className="brand-tagline">Professional Trading Platform</span>
              </div>
            </div>

            <div className="navbar-divider"></div>

            <nav className="navbar-menu">
              <button 
                className={`nav-item ${currentView === 'trading' ? 'active' : ''}`}
                onClick={() => setCurrentView('trading')}
              >
                <TrendingUp size={18} />
                <span>Trading</span>
              </button>
              <button 
                className={`nav-item ${currentView === 'markets' ? 'active' : ''}`}
                onClick={() => setCurrentView('markets')}
              >
                <BarChart3 size={18} />
                <span>Markets</span>
              </button>
              <button className="nav-item" onClick={() => setShowLanding(true)}>
                <Home size={18} />
                <span>Home</span>
              </button>
            </nav>
          </div>

          <div className="navbar-right">
            {/* Connection Status */}
            <div
              className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}
              onClick={!isConnected ? handleReconnect : undefined}
              title={!isConnected ? 'Click to reconnect' : 'Live connection'}
            >
              <span className="status-dot"></span>
              <span className="status-text">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
              {isConnected ? <Wifi size={16} /> : <RefreshCw size={16} />}
            </div>
          </div>
        </nav>

        {/* Scrollable Content Wrapper */}
        <div className="trading-content-wrapper">
          {/* Symbol Selector Bar */}
          <div className="symbol-selector-bar">
            <div className="symbol-tabs">
              {SYMBOLS.map((s) => (
                <button
                  key={s.value}
                  className={`symbol-tab ${symbol === s.value ? 'active' : ''}`}
                  onClick={() => handleSymbolChange(s.value)}
                >
                  <span className="symbol-icon">{s.icon}</span>
                  <span className="symbol-label">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="symbol-info">
              <span className="current-symbol">{currentSymbol.icon} {currentSymbol.label}</span>
            </div>
          </div>

          {/* Ticker Bar */}
          <TickerBar symbol={symbol} />

          {/* Conditional Content Based on View */}
          {currentView === 'trading' ? (
            /* Main Trading Area */
            <div className="trading-grid">
              {/* Left Sidebar */}
              <aside className="trading-sidebar left">
                <OrderEntry symbol={symbol} toast={toast} fillPrice={fillPrice} />
                <PositionPanel symbol={symbol} />
                <RecentTrades symbol={symbol} />
              </aside>

              {/* Center Content */}
              <main className="trading-main">
                <PriceChart symbol={symbol} />
                <OpenOrders symbol={symbol} toast={toast} />
              </main>

              {/* Right Sidebar */}
              <aside className="trading-sidebar right">
                <OrderBook symbol={symbol} onPriceClick={(price) => setFillPrice(price)} />
              </aside>
            </div>
          ) : (
            /* Markets Overview */
            <MarketsView onSelectSymbol={(sym) => { setSymbol(sym); setCurrentView('trading'); }} />
          )}
        </div>

        {/* Footer */}
        <footer className="terminal-footer">
          <div className="footer-content">
            <div className="footer-left">
              <span className="footer-text">
                © 2026 CryptoHFT Platform · Developed by{' '}
                <span className="footer-developer">Saket Saurav</span>
              </span>
            </div>
            <div className="footer-right">
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.open('https://github.com/yourusername/CryptoHFT/blob/main/README.md', '_blank'); 
                }} 
                className="footer-link"
              >
                Documentation
              </a>
              <span className="footer-separator">·</span>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.open('http://localhost:8080/swagger-ui.html', '_blank'); 
                }} 
                className="footer-link"
              >
                API
              </a>
              <span className="footer-separator">·</span>
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.open('https://github.com/yourusername/CryptoHFT/issues', '_blank'); 
                }} 
                className="footer-link"
              >
                Support
              </a>
            </div>
          </div>
        </footer>
      </div>

      <Toast toasts={toasts} dismiss={toast.dismiss} />
    </>
  );
}

export default App;
