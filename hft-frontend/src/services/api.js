import axios from 'axios';

// Use relative URLs so Vite proxy routes them to localhost:8080
const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Test backend availability
const testBackendConnection = async () => {
  try {
    await axios.get('http://localhost:8080/actuator/health', { timeout: 2000 });
    return true;
  } catch {
    console.error('Backend not available at localhost:8080');
    return false;
  }
};

// Test on load
testBackendConnection();

// ── Request interceptor ────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    const ms = Date.now() - (response.config.metadata?.startTime ?? Date.now());
    response.latencyMs = ms;
    return response;
  },
  (error) => {
    const msg =
      error.response?.data?.errorMessage ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error';
    const code =
      error.response?.data?.errorCode ||
      `HTTP_${error.response?.status ?? 'NETWORK'}`;
    const enriched = new Error(msg);
    enriched.code = code;
    enriched.status = error.response?.status;
    return Promise.reject(enriched);
  }
);

// ── Order Service ──────────────────────────────────────────────────────────────
export const OrderService = {
  /**
   * Submit a new order.
   * @param {{ symbol, side, orderType, price, quantity, timeInForce, account }} order
   */
  submitOrder: async (order) => {
    const res = await apiClient.post('/orders', order);
    return res.data;
  },

  /** Cancel an order by ID. */
  cancelOrder: async (orderId) => {
    const res = await apiClient.delete(`/orders/${orderId}`);
    return res.data;
  },

  /** Get open orders for a symbol. */
  getOpenOrders: async (symbol) => {
    const res = await apiClient.get('/orders/open', { params: { symbol } });
    return res.data;
  },

  /** Get order history (all statuses) for a symbol. */
  getOrderHistory: async (symbol, limit = 100) => {
    const res = await apiClient.get('/orders', { params: { symbol, limit } });
    return res.data;
  },

  /** Get a single order by ID. */
  getOrder: async (orderId) => {
    const res = await apiClient.get(`/orders/${orderId}`);
    return res.data;
  },

  /** Cancel all open orders for a symbol. */
  cancelAllOrders: async (symbol) => {
    const res = await apiClient.delete('/orders/cancel-all', { params: { symbol } });
    return res.data;
  },

  /** Batch cancel by order ID list. */
  cancelOrders: async (orderIds) => {
    const res = await apiClient.post('/orders/cancel-batch', { orderIds });
    return res.data;
  },
};

// ── Market Service ─────────────────────────────────────────────────────────────
export const MarketService = {
  /**
   * Get 24h market statistics.
   * @param {string} [symbol] - leave blank to get stats for all symbols
   */
  getStats: async (symbol) => {
    const res = await apiClient.get('/market/stats', {
      params: symbol ? { symbol } : undefined,
    });
    return res.data; // array of MarketStatsResponse
  },
};

// ── Account Service ────────────────────────────────────────────────────────────
export const AccountService = {
  /**
   * Get positions for a symbol and account.
   * @param {string} [symbol]
   * @param {string} [account='DEFAULT']
   */
  getPositions: async (symbol, account = 'DEFAULT') => {
    const res = await apiClient.get('/account/positions', {
      params: { symbol, account },
    });
    return res.data; // array of PositionResponse
  },

  /** Get risk stats (P&L, order counts, circuit breaker). */
  getRiskStats: async () => {
    const res = await apiClient.get('/account/risk');
    return res.data;
  },
};
