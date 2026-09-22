import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Zap,
  Shield,
  Activity,
  ArrowRight,
  Check,
  BarChart3,
  GitBranch,
  Cpu,
  Database,
  Layers,
  Network,
  ChevronRight
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onEnterApp }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'Ultra-Low Latency',
      description: 'Aeron IPC messaging with sub-microsecond performance',
      color: '#00d97e'
    },
    {
      icon: Activity,
      title: 'Real-Time Trading',
      description: 'LMAX Disruptor for high-performance order matching',
      color: '#4f8ef7'
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Pre-trade risk checks and position limits',
      color: '#f04747'
    },
    {
      icon: Network,
      title: 'Multi-Exchange',
      description: 'Connect to multiple crypto exchanges via FIX/WebSocket',
      color: '#ffa500'
    }
  ];

  const techStack = [
    { name: 'Java 17', category: 'Runtime' },
    { name: 'Spring Boot 3.2', category: 'Framework' },
    { name: 'Aeron', category: 'Messaging' },
    { name: 'LMAX Disruptor', category: 'Performance' },
    { name: 'PostgreSQL', category: 'Database' },
    { name: 'React 19', category: 'Frontend' },
    { name: 'Netty', category: 'Networking' },
    { name: 'QuickFIX/J', category: 'Protocol' }
  ];

  const architecture = [
    { module: 'REST API', description: 'Spring-based RESTful services' },
    { module: 'WebSocket', description: 'Real-time data streaming' },
    { module: 'Matching Engine', description: 'Price-time priority order matching' },
    { module: 'Risk Manager', description: 'Pre-trade risk validation' },
    { module: 'Market Data', description: 'Multi-exchange connectors' },
    { module: 'FIX Gateway', description: 'FIX 4.4 protocol support' }
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
        <div className="hero-background">
          <div className="grid-overlay"></div>
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <TrendingUp size={16} />
            <span>Enterprise-Grade Trading Platform</span>
          </div>

          <h1 className="hero-title">
            <span className="title-crypto">Crypto</span>
            <span className="title-hft">HFT</span>
            <br />
            <span className="title-subtitle">High-Frequency Trading Platform</span>
          </h1>

          <p className="hero-description">
            Ultra-low latency cryptocurrency trading system built with Java 17, Spring Boot,
            and cutting-edge messaging technologies. Execute trades in microseconds with
            institutional-grade reliability.
          </p>

          <div className="hero-cta">
            <button className="cta-button cta-primary" onClick={onEnterApp}>
              <span>Launch Trading Terminal</span>
              <ArrowRight size={20} />
            </button>
            <button className="cta-button cta-secondary" onClick={() => window.open('https://github.com/yourusername/CryptoHFT', '_blank')}>
              <span>View Documentation</span>
              <GitBranch size={18} />
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">&lt;1μs</div>
              <div className="stat-label">Message Latency</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">100K+</div>
              <div className="stat-label">Orders/Second</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">99.99%</div>
              <div className="stat-label">Uptime SLA</div>
            </div>
          </div>
        </div>

        <div className="hero-illustration">
          <div className="terminal-mockup">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <span className="terminal-title">CryptoHFT Terminal</span>
            </div>
            <div className="terminal-body">
              <div className="terminal-line">
                <span className="prompt">$</span>
                <span className="command">hft-engine</span>
                <span className="args">--mode=live</span>
              </div>
              <div className="terminal-output success">
                <Check size={14} /> Aeron transport initialized
              </div>
              <div className="terminal-output success">
                <Check size={14} /> Matching engine started
              </div>
              <div className="terminal-output success">
                <Check size={14} /> Connected to Binance
              </div>
              <div className="terminal-line">
                <span className="prompt">$</span>
                <span className="cursor"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Engineered for Speed</h2>
            <p className="section-subtitle">
              Built from the ground up for high-frequency trading with enterprise-grade performance
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="feature-card"
                  onMouseEnter={() => setActiveFeature(idx)}
                  style={{
                    borderColor: activeFeature === idx ? feature.color : 'rgba(255,255,255,0.06)'
                  }}
                >
                  <div className="feature-icon" style={{ backgroundColor: `${feature.color}15` }}>
                    <Icon size={28} color={feature.color} />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                  <div className="feature-arrow" style={{ color: feature.color }}>
                    <ChevronRight size={20} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="architecture-section">
        <div className="section-container">
          <div className="section-header">
            <Layers size={32} color="#00d97e" />
            <h2 className="section-title">Modular Architecture</h2>
            <p className="section-subtitle">
              Microservice-based design for scalability and maintainability
            </p>
          </div>

          <div className="architecture-grid">
            {architecture.map((item, idx) => (
              <div key={idx} className="architecture-card">
                <div className="arch-icon">
                  <Cpu size={20} color="#4f8ef7" />
                </div>
                <div className="arch-content">
                  <h4 className="arch-title">{item.module}</h4>
                  <p className="arch-desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Backend Features Section */}
      <section className="backend-features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Powerful Backend Engine</h2>
            <p className="section-subtitle">
              Enterprise-grade Java backend with ultra-low latency messaging and advanced trading features
            </p>
          </div>

          <div className="backend-features-grid">
            <div className="backend-feature-card">
              <div className="backend-feature-header">
                <div className="backend-feature-icon" style={{ background: 'rgba(0, 217, 126, 0.1)' }}>
                  <Zap size={24} color="#00d97e" />
                </div>
                <h3 className="backend-feature-title">Aeron Ultra-Low Latency Messaging</h3>
              </div>
              <p className="backend-feature-desc">
                Aeron IPC provides sub-microsecond inter-process communication using efficient memory-mapped files
                and lock-free ring buffers for maximum throughput and minimal latency.
              </p>
              <ul className="backend-feature-list">
                <li><Check size={16} color="#00d97e" /> <span>Sub-microsecond message latency</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Zero-copy message passing</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Off-heap memory for reduced GC</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Reliable UDP transport protocol</span></li>
              </ul>
            </div>

            <div className="backend-feature-card">
              <div className="backend-feature-header">
                <div className="backend-feature-icon" style={{ background: 'rgba(79, 142, 247, 0.1)' }}>
                  <Activity size={24} color="#4f8ef7" />
                </div>
                <h3 className="backend-feature-title">LMAX Disruptor Pattern</h3>
              </div>
              <p className="backend-feature-desc">
                High-performance inter-thread messaging using the proven Disruptor pattern, capable of processing
                millions of events per second with mechanical sympathy.
              </p>
              <ul className="backend-feature-list">
                <li><Check size={16} color="#4f8ef7" /> <span>100K+ messages per second</span></li>
                <li><Check size={16} color="#4f8ef7" /> <span>Lock-free concurrent design</span></li>
                <li><Check size={16} color="#4f8ef7" /> <span>CPU cache-friendly structure</span></li>
                <li><Check size={16} color="#4f8ef7" /> <span>Predictable low latency</span></li>
              </ul>
            </div>

            <div className="backend-feature-card">
              <div className="backend-feature-header">
                <div className="backend-feature-icon" style={{ background: 'rgba(0, 217, 126, 0.1)' }}>
                  <GitBranch size={24} color="#00d97e" />
                </div>
                <h3 className="backend-feature-title">Order Matching Engine</h3>
              </div>
              <p className="backend-feature-desc">
                Price-time priority matching engine with support for multiple order types including limit, market,
                stop-loss, and advanced order strategies.
              </p>
              <ul className="backend-feature-list">
                <li><Check size={16} color="#00d97e" /> <span>Price-time priority algorithm</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Multiple order types (Limit, Market, Stop)</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Time-in-force options (GTC, IOC, FOK)</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Real-time order book management</span></li>
              </ul>
            </div>

            <div className="backend-feature-card">
              <div className="backend-feature-header">
                <div className="backend-feature-icon" style={{ background: 'rgba(240, 71, 71, 0.1)' }}>
                  <Shield size={24} color="#f04747" />
                </div>
                <h3 className="backend-feature-title">Pre-Trade Risk Management</h3>
              </div>
              <p className="backend-feature-desc">
                Comprehensive risk checks before order execution including position limits, daily loss limits,
                and circuit breakers to protect against adverse market conditions.
              </p>
              <ul className="backend-feature-list">
                <li><Check size={16} color="#f04747" /> <span>Position size limits per symbol</span></li>
                <li><Check size={16} color="#f04747" /> <span>Daily P&L loss limits</span></li>
                <li><Check size={16} color="#f04747" /> <span>Order rate limiting</span></li>
                <li><Check size={16} color="#f04747" /> <span>Automatic circuit breakers</span></li>
              </ul>
            </div>

            <div className="backend-feature-card">
              <div className="backend-feature-header">
                <div className="backend-feature-icon" style={{ background: 'rgba(79, 142, 247, 0.1)' }}>
                  <Network size={24} color="#4f8ef7" />
                </div>
                <h3 className="backend-feature-title">Market Data Processing</h3>
              </div>
              <p className="backend-feature-desc">
                Real-time market data from multiple exchanges via WebSocket and TCP connections with order book
                reconstruction and tick data normalization.
              </p>
              <ul className="backend-feature-list">
                <li><Check size={16} color="#4f8ef7" /> <span>Multi-exchange connectivity (Binance, Coinbase)</span></li>
                <li><Check size={16} color="#4f8ef7" /> <span>Real-time order book snapshots</span></li>
                <li><Check size={16} color="#4f8ef7" /> <span>Trade and quote data streaming</span></li>
                <li><Check size={16} color="#4f8ef7" /> <span>Sub-millisecond data processing</span></li>
              </ul>
            </div>

            <div className="backend-feature-card">
              <div className="backend-feature-header">
                <div className="backend-feature-icon" style={{ background: 'rgba(0, 217, 126, 0.1)' }}>
                  <Database size={24} color="#00d97e" />
                </div>
                <h3 className="backend-feature-title">FIX Protocol Gateway</h3>
              </div>
              <p className="backend-feature-desc">
                QuickFIX/J implementation supporting FIX 4.4 protocol for connectivity with institutional
                exchanges and prime brokers with session management and message logging.
              </p>
              <ul className="backend-feature-list">
                <li><Check size={16} color="#00d97e" /> <span>FIX 4.4 protocol support</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Session state management</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Message sequencing & recovery</span></li>
                <li><Check size={16} color="#00d97e" /> <span>Institutional exchange connectivity</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="tech-section">
        <div className="section-container">
          <div className="section-header">
            <Database size={32} color="#00d97e" />
            <h2 className="section-title">Modern Tech Stack</h2>
            <p className="section-subtitle">
              Industry-leading technologies for maximum performance
            </p>
          </div>

          <div className="tech-grid">
            {techStack.map((tech, idx) => (
              <div key={idx} className="tech-badge">
                <span className="tech-name">{tech.name}</span>
                <span className="tech-category">{tech.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Trading?</h2>
            <p className="cta-description">
              Experience institutional-grade trading with microsecond execution
            </p>
            <button className="cta-button cta-primary cta-large" onClick={onEnterApp}>
              <span>Launch Trading Terminal</span>
              <ArrowRight size={22} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <BarChart3 size={24} color="#00d97e" />
              <span className="footer-logo-text">
                Crypto<span style={{ color: '#00d97e' }}>HFT</span>
              </span>
            </div>
            <p className="footer-tagline">
              High-frequency trading platform for cryptocurrency markets
            </p>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2026 CryptoHFT Platform. Developed by{' '}
              <span className="developer-name">Saket Saurav</span>
            </p>
            <div className="footer-links">
              <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/yourusername/CryptoHFT/blob/main/README.md', '_blank'); }} className="footer-link">Documentation</a>
              <span className="footer-separator">•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/yourusername/CryptoHFT', '_blank'); }} className="footer-link">GitHub</a>
              <span className="footer-separator">•</span>
              <a href="#" onClick={(e) => { e.preventDefault(); window.open('https://github.com/yourusername/CryptoHFT/blob/main/LICENSE', '_blank'); }} className="footer-link">License</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
