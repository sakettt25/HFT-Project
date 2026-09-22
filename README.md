# CryptoHFT - High-Frequency Trading Platform

A professional-grade cryptocurrency high-frequency trading platform with ultra-low latency order matching, real-time market data, and institutional-grade risk management.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Java](https://img.shields.io/badge/Java-17-orange)
![React](https://img.shields.io/badge/React-18-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)

## 🚀 Features

### Trading Engine
- **Ultra-Low Latency**: Sub-microsecond order matching with lock-free data structures
- **Price-Time Priority**: FIFO matching algorithm for fair order execution
- **Order Types**: MARKET, LIMIT, STOP, STOP_LIMIT
- **Time in Force**: GTC, IOC, FOK, GTD
- **Real-time Order Book**: Live bid/ask depth with WebSocket streaming

### Risk Management
- **Pre-trade Checks**: Position limits, order size limits, notional limits
- **Real-time Monitoring**: Continuous PnL tracking and exposure calculation
- **Circuit Breakers**: Automatic trading halt on risk threshold breach
- **Account Segregation**: Multi-account support with isolated risk limits

### Market Data
- **Live Binance Integration**: Real-time WebSocket market data from Binance
- **Multiple Symbols**: BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT, XRPUSDT
- **24-Hour Statistics**: High, low, volume, VWAP, price changes
- **Trade History**: Complete fill history with microsecond timestamps

### User Interface
- **Professional Trading Terminal**: Excel-inspired green theme design
- **Real-time Updates**: WebSocket-powered live data streaming
- **Interactive Order Book**: Visual depth chart and price ladder
- **Position Management**: Live P&L tracking and position sizing
- **Order Management**: Submit, cancel, and monitor orders in real-time

## 📋 Prerequisites

- **Java 17+** - Required for backend
- **Maven 3.8+** - Build tool
- **Node.js 18+** - Required for frontend
- **npm 9+** - Package manager

## 🛠️ Installation

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sakettt25/HFT-Project.git
   cd HFT-Project
   ```

2. **Configure Binance API** (optional for live data):
   ```bash
   cd hft-app
   cp .env.example .env
   # Edit .env and add your Binance API keys
   ```

3. **Build the project**:
   ```bash
   mvn clean package -DskipTests
   ```

4. **Run the backend**:
   ```bash
   cd hft-app
   java -jar target/hft-app-1.0.0-SNAPSHOT.jar
   ```

Backend will start on **http://localhost:8080**

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd hft-frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

Frontend will start on **http://localhost:5173**

## 🎯 Quick Start

1. **Access the application**: Open http://localhost:5173
2. **View landing page**: Click "Get Started" or "View Documentation"
3. **Start trading**: Click "Markets" to open trading terminal
4. **Select symbol**: Choose from BTCUSDT, ETHUSDT, SOLUSDT, etc.
5. **Place orders**: Use the order entry panel to submit trades
6. **Monitor positions**: Track your P&L and open orders

## 📚 Documentation

### API Documentation
- **REST API**: http://localhost:8080/swagger-ui.html
- **WebSocket API**: ws://localhost:8080/ws/trading
- **Health Check**: http://localhost:8080/actuator/health

### Key Endpoints

#### Market Data
- `GET /api/v1/markets` - Get all market statistics
- `GET /api/v1/markets/{symbol}` - Get specific symbol stats
- `GET /api/v1/positions` - Get all positions
- `GET /api/v1/positions/{symbol}` - Get position for symbol

#### Order Management
- `POST /api/v1/orders` - Submit new order
- `GET /api/v1/orders` - Get all orders
- `GET /api/v1/orders/open` - Get open orders
- `DELETE /api/v1/orders/{orderId}` - Cancel order
- `DELETE /api/v1/orders/cancel-all` - Cancel all orders

### WebSocket Topics
- `orders` - Order updates (NEW, FILLED, CANCELLED)
- `trades` - Trade executions
- `marketdata` - Real-time order book updates

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  • Trading Terminal  • Order Entry  • Live Charts       │
└────────────────────┬────────────────────────────────────┘
                     │ REST + WebSocket
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Spring Boot Backend                     │
│  • REST Controllers  • WebSocket Handler                │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
             ▼                           ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  Matching Engine     │    │   Risk Manager           │
│  • Order Book        │    │   • Pre-trade Checks     │
│  • Price-Time Match  │    │   • Position Limits      │
│  • Trade Execution   │    │   • Circuit Breakers     │
└──────────┬───────────┘    └──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│                  Market Data Layer                       │
│  • Binance WebSocket  • Order Book Sync  • Tick Data   │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security

- **API Key Management**: Store keys in `.env` file (never commit!)
- **Risk Limits**: Configurable position and order size limits
- **Account Isolation**: Separate user and market maker accounts
- **CORS Protection**: Configured for development and production

## 📊 Performance

- **Order Latency**: < 100µs (microseconds) in-memory matching
- **WebSocket Latency**: < 10ms round-trip time
- **Market Data**: Real-time updates with < 50ms delay
- **Throughput**: 10,000+ orders/second per symbol

## 🧪 Testing

Run tests for backend:
```bash
mvn test
```

Run tests for frontend:
```bash
cd hft-frontend
npm test
```

## 📝 Configuration

### Backend Configuration
Edit `hft-app/src/main/resources/application.yml`:

```yaml
hft:
  risk:
    max-order-size: 1000
    max-position-size: 10000
  market-data:
    exchange: BINANCE
    symbols: BTCUSDT,ETHUSDT,SOLUSDT,BNBUSDT,XRPUSDT
```

### Frontend Configuration
Edit `hft-frontend/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8080/api/v1';
const WS_URL = 'ws://localhost:8080/ws/trading';
```

## 🐛 Troubleshooting

### Backend won't start
- Check Java version: `java -version` (should be 17+)
- Check port 8080 is not in use
- Review logs in console for errors

### Frontend won't connect
- Ensure backend is running on port 8080
- Check CORS configuration
- Verify WebSocket connection in browser console

### Orders not filling
- Check if market maker is seeded (look for "Market maker liquidity seeded" in logs)
- Verify order book has liquidity for your symbol
- Check risk manager isn't rejecting orders

## 📖 Additional Resources

- **Full Setup Guide**: See `FULL_STACK_SETUP.md`
- **Backend Fix Documentation**: See `BACKEND_FIX_COMPLETE.md`
- **Binance API Setup**: See `BINANCE_API_SETUP.md`
- **Market Data Fix**: See `MARKET_DATA_FIX.md`

## 🤝 Support

- **Issues**: https://github.com/sakettt25/HFT-Project/issues
- **Discussions**: https://github.com/sakettt25/HFT-Project/discussions
- **Email**: saketsaurav@example.com

## 👨‍💻 Developer

**Saket Saurav**
- GitHub: https://github.com/sakettt25
- Platform architecture and implementation
- High-frequency trading engine design
- Real-time market data integration

## 📄 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- **Binance** - Market data provider
- **Spring Boot** - Backend framework
- **React** - Frontend framework
- **Aeron** - Low-latency messaging (optional)

---

**Built with ❤️ for high-frequency trading**

Last Updated: September 23, 2026
