# CryptoHFT — High-Frequency Trading Platform

A full-stack cryptocurrency trading platform built with Spring Boot and React. The backend implements a real matching engine with price-time priority, pre-trade risk management, and real-time WebSocket streaming. The frontend provides a professional trading terminal.

**GitHub:** https://github.com/sakettt25/HFT-Project  
**Developed by:** Saket Saurav

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.2 |
| Matching Engine | LMAX Disruptor, Agrona |
| Persistence | Spring Data JPA, H2 (dev) / PostgreSQL (prod) |
| Real-time | Spring WebSocket |
| Market Data | Binance WebSocket API |
| Frontend | React 18, Vite |
| Build | Maven (multi-module) |

---

## Project Structure

```
CryptoHFT/
├── hft-common/          # Shared domain models (Order, Trade, Position)
├── hft-engine/          # Matching engine + risk manager
├── hft-api/             # Spring Boot REST controllers + WebSocket handler
├── hft-persistence/     # JPA entities + repositories
├── hft-market-data/     # Binance WebSocket client + TCP server
├── hft-aeron/           # Aeron transport (optional, disabled by default)
├── hft-fix-gateway/     # FIX protocol gateway (optional)
├── hft-sbe/             # SBE message codecs
├── hft-app/             # Spring Boot application entry point + config
└── hft-frontend/        # React trading terminal
```

---

## Backend — How It Works

### 1. Order Matching Engine (`hft-engine`)

The core of the system is `OrderMatchingEngine.java`, which implements a **price-time priority central limit order book (CLOB)**.

**Data structures:**

```java
// Bids sorted descending (best bid first)
TreeMap<Long, LinkedList<OrderEntry>> bids = new TreeMap<>(Comparator.reverseOrder());
// Asks sorted ascending (best ask first)
TreeMap<Long, LinkedList<OrderEntry>> asks = new TreeMap<>();
// O(1) order lookup by ID
Long2ObjectHashMap<OrderEntry> orderIndex = new Long2ObjectHashMap<>();
```

Prices are stored as `long` integers (multiplied by `100_000_000` for 8 decimal places of precision) to avoid `BigDecimal` overhead in the hot path.

**Concurrency — LMAX Disruptor:**

All order operations go through a `Disruptor` ring buffer rather than a traditional queue. Orders are published to the ring buffer and processed single-threaded by the event handler, eliminating lock contention entirely:

```java
this.disruptor = new Disruptor<>(
    OrderEvent::new,
    1024 * 64,              // 65,536-slot ring buffer (power of 2)
    threadFactory,
    ProducerType.MULTI,     // multiple REST threads can publish
    new BusySpinWaitStrategy()  // lowest latency wait strategy
);
disruptor.handleEventsWith(this::processEvent);
```

**Matching algorithm:**

A new order is matched against the opposite book side. For a LIMIT order, crossing is checked at each price level — buy orders only match asks at or below the limit price, sell orders only match bids at or above the limit price. MARKET orders sweep the book until fully filled or rejected for no liquidity:

```java
// Price constraint check for limit orders
if (aggressor.getOrder().getOrderType() == Order.OrderType.LIMIT) {
    if (side == BUY && priceLevel.getKey() > aggressor.getPriceKey()) break;
    if (side == SELL && priceLevel.getKey() < aggressor.getPriceKey()) break;
}
```

After matching, any unfilled remainder of a LIMIT order is added to the book. A MARKET order with remaining quantity is rejected. Each trade fires two `Trade` events — one for the aggressor (taker) and one for the passive side (maker).

---

### 2. Risk Manager (`hft-engine`)

`RiskManager.java` runs a synchronous pre-trade check on every order before it reaches the matching engine. It uses `Object2ObjectHashMap` from Agrona (open-addressed, cache-friendly) for position and exposure tracking.

**Checks performed per order:**

| Check | Description |
|---|---|
| Circuit breaker | Hard stop — all orders rejected if triggered |
| Rate limit | Max orders per second per session |
| Order size | Min / max quantity bounds |
| Notional value | `price × qty` must not exceed configured cap |
| Position limit | Projected net position after fill cannot exceed `maxPositionSize` |
| Total exposure | Sum of all notional positions across symbols |
| Daily loss | Cumulative realized PnL floor |
| Price deviation | Limit price must be within 10% of current average entry |

Pending exposure is tracked separately so that multiple open orders for the same symbol are counted cumulatively:

```java
BigDecimal projectedPosition = currentQty
    .add(side == BUY ? quantity : quantity.negate())
    .add(pendingExposure);  // already-open orders count toward the limit
```

Position averaging uses weighted average cost for additions and preserves the existing average price for reductions, with realized PnL calculated on the reduced quantity.

---

### 3. Order Service (`hft-api`)

`OrderService.java` is the orchestration layer that ties everything together. It owns the `ConcurrentHashMap<String, OrderMatchingEngine>` keyed by symbol — engines are created lazily on first order for a symbol.

**Order submission flow:**

```
REST POST /api/v1/orders
    │
    ▼
OrderService.submitOrder()
    ├── Generate snowflake order ID (IdGenerator)
    ├── Record nanosecond timestamp (NanoClock)
    ├── RiskManager.checkOrder()     ← pre-trade check
    │       └── REJECTED → return immediately
    ├── RiskManager.addPendingExposure()
    ├── OrderRepository.save()       ← persist as NEW
    └── OrderMatchingEngine.submitOrder()  ← publish to ring buffer
            ├── match → Trade events → listeners
            └── remainder → resting in book
```

When an engine is created for a new symbol, two listeners are registered:

- **Trade listener** — updates position in `RiskManager`, records 24h stats in `MarketService`, broadcasts trade via WebSocket, and pushes updated order book depth
- **Order update listener** — calls `OrderRepository.updateFill()` to persist the fill, broadcasts order state change via WebSocket, and pushes updated order book

Submit latency is measured in nanoseconds from entry to return and reported back to the client in microseconds (`submitLatencyUs`).

---

### 4. Market Service (`hft-api`)

`MarketService.java` computes live market statistics from the in-memory engine state on every request. There is no cache — it reads directly from the order book.

**Mark price calculation:**

```java
if (bestBid != null && bestAsk != null)
    markPrice = (bestBid + bestAsk) / 2;   // mid-market price
else if one side present
    markPrice = that side's best price;
else
    markPrice = lastTradePrice;             // fallback to last fill price
```

**24h statistics** (high, low, open, volume) are accumulated in plain `HashMap`s since startup, updated on every trade via `recordTrade()`. The open orders count filters out `MARKET_MAKER` account orders so the user only sees their own activity.

---

### 5. WebSocket Handler (`hft-api`)

`TradingWebSocketHandler.java` extends Spring's `TextWebSocketHandler` and manages three subscription types:

- `marketdata` — keyed by symbol (`ConcurrentHashMap<String, Set<WebSocketSession>>`)
- `orders` — keyed by account
- `trades` — keyed by account

Sessions subscribe by sending a JSON message:

```json
{ "type": "subscribe", "channel": "marketdata", "symbol": "BTCUSDT" }
```

The handler uses `CopyOnWriteArraySet` for the global session set and `ConcurrentHashMap.newKeySet()` for per-subscription sets, so broadcast is lock-free. Order book updates are pushed on every trade and every order state change.

---

### 6. Persistence Layer (`hft-persistence`)

`OrderEntity.java` maps to the `orders` table with four indexes: `symbol`, `account`, `status`, and `created_at`. Fills are updated with a targeted `@Modifying` JPQL query rather than fetching and saving the full entity:

```java
@Modifying
@Query("UPDATE OrderEntity o SET o.status = :status, o.filledQuantity = :filledQty, " +
       "o.remainingQuantity = :remainingQty, o.averagePrice = :avgPrice, " +
       "o.updatedAt = CURRENT_TIMESTAMP WHERE o.orderId = :orderId")
int updateFill(...);
```

Nanosecond timestamps (`submittedNanos`, `acknowledgedNanos`) are stored alongside wall-clock `Instant` fields for latency measurement.

**Dev profile** uses H2 in-memory with `ddl-auto: update`. **Prod profile** uses PostgreSQL with Flyway migrations and `ddl-auto: validate`.

---

### 7. Application Configuration (`hft-app`)

`TradingConfig.java` is the Spring `@Configuration` class that wires all components. `RiskManager` is a singleton bean with limits loaded from `application.yml` via `@Value`. The Binance `WebSocketMarketDataClient` is started as a bean and connects on startup. Aeron and FIX gateway are disabled by default (`hft.aeron.enabled: false`, `hft.fix.enabled: false`) and can be toggled via environment variables without code changes.

`application.yml` uses environment variable substitution throughout so the same jar runs in dev (H2) and prod (PostgreSQL) with no changes:

```yaml
datasource:
  url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:hft_trading}
```

---

## REST API

Base URL: `http://localhost:8080/api/v1`

### Orders

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/orders` | Submit a new order |
| `GET` | `/orders` | List orders (filter by symbol, status, limit) |
| `GET` | `/orders/open` | Open orders for current user |
| `GET` | `/orders/{orderId}` | Get single order |
| `DELETE` | `/orders/{orderId}` | Cancel an order |
| `DELETE` | `/orders/cancel-all` | Cancel all open orders |
| `POST` | `/orders/cancel-batch` | Cancel a list of order IDs |

**Submit order body:**

```json
{
  "symbol": "BTCUSDT",
  "side": "BUY",
  "orderType": "LIMIT",
  "price": 42500.00,
  "quantity": 0.01,
  "timeInForce": "GTC",
  "account": "DEFAULT"
}
```

**Response includes `submitLatencyUs`** — the round-trip time from HTTP request entry to response in microseconds.

### Market Data

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/markets` | Stats for all active symbols |
| `GET` | `/markets/{symbol}` | Stats for one symbol |
| `GET` | `/positions` | All positions |
| `GET` | `/positions/{symbol}` | Position for a symbol |
| `GET` | `/markets/risk` | Risk manager stats |

---

## WebSocket API

**Endpoint:** `ws://localhost:8080/ws/trading`

**Subscribe:**
```json
{ "type": "subscribe", "channel": "marketdata", "symbol": "BTCUSDT" }
{ "type": "subscribe", "channel": "orders", "account": "DEFAULT" }
{ "type": "subscribe", "channel": "trades", "account": "DEFAULT" }
```

**Inbound message types:** `marketdata`, `order`, `trade`, `subscribed`, `pong`, `error`

---

## Running Locally

### Requirements

- Java 17+
- Maven 3.8+
- Node.js 18+

### Backend

```bash
git clone https://github.com/sakettt25/HFT-Project.git
cd HFT-Project

mvn clean package -DskipTests

cd hft-app
java -jar target/hft-app-1.0.0-SNAPSHOT.jar
```

Starts on `http://localhost:8080`. Uses H2 in-memory database by default (dev profile).

### Frontend

```bash
cd hft-frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Binance API (optional)

For live market data, add keys to `hft-app/.env`:

```
BINANCE_API_KEY=your_key_here
BINANCE_SECRET_KEY=your_secret_here
```

Without keys, the platform runs entirely on the internal matching engine with market maker liquidity seeded at startup.

---

## Order Lifecycle

```
Client POST /orders
    │
    ▼
PENDING_NEW → risk check passes → NEW (persisted)
    │
    ├── matched immediately → FILLED
    ├── partially matched → PARTIALLY_FILLED (resting remainder)
    ├── no match (MARKET, no liquidity) → REJECTED
    └── client cancels → CANCELLED
```

---

## Configuration Reference

All values in `application.yml` can be overridden with environment variables:

| Variable | Default | Description |
|---|---|---|
| `RISK_MAX_ORDER_SIZE` | `1000` | Max qty per order |
| `RISK_MIN_ORDER_SIZE` | `0.001` | Min qty per order |
| `RISK_MAX_POSITION_SIZE` | `10000` | Max net position per symbol |
| `RISK_MAX_DAILY_LOSS` | `100000` | Daily loss circuit breaker |
| `RISK_MAX_ORDERS_PER_SECOND` | `100` | Order rate limit |
| `MARKET_DATA_SYMBOLS` | `BTCUSDT,ETHUSDT` | Symbols to track |
| `MARKET_DATA_EXCHANGE` | `BINANCE` | Exchange for market data |
| `DB_HOST` | `localhost` | PostgreSQL host (prod) |
| `AERON_ENABLED` | `false` | Enable Aeron transport |
| `FIX_ENABLED` | `false` | Enable FIX gateway |
