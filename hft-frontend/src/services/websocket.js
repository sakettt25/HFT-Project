// WebSocket service for real-time trading updates
export class TradingWebSocket {
  constructor(url = 'ws://localhost:8080/ws/trading') {
    this.url = url;
    this.ws = null;
    this.listeners = {
      marketdata: [],
      orders: [],
      trades: [],
      connection: []
    };
    this.reconnectTimer = null;
    this.isConnected = false;
    this.currentSymbol = 'BTCUSDT';
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✅ WebSocket Connected to backend');
        this.isConnected = true;
        this._notifyListeners('connection', true);
        
        // Subscribe to initial channels
        this.subscribe('orders', 'DEFAULT');
        this.subscribe('trades', 'DEFAULT');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Route message based on type or channel
          if (data.channel) {
            this._notifyListeners(data.channel, data);
          } else if (data.type) {
            this._notifyListeners(data.type, data);
          } else {
             // Fallback routing, guessing from payload structure
             if (data.bids || data.asks) this._notifyListeners('marketdata', data);
             else if (data.orderId) this._notifyListeners('orders', data);
             else if (data.tradeId) this._notifyListeners('trades', data);
          }
        } catch (err) {
          console.error('Error parsing WS message', err, event.data);
        }
      };

      this.ws.onclose = () => {
        console.log('❌ WebSocket Disconnected from backend');
        this.isConnected = false;
        this._notifyListeners('connection', false);
        
        // Try to reconnect
        this._scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('❌ WebSocket Error', err);
        this.ws.close();
      };
    } catch (err) {
      console.error('❌ Failed to create WebSocket connection', err);
      this.isConnected = false;
      this._notifyListeners('connection', false);
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 Attempting to reconnect to backend...');
      this.connect();
    }, 3000);
  }

  subscribe(channel, symbolOrAccount) {
    if (channel === 'marketdata') {
      this.currentSymbol = symbolOrAccount;
    }
    
    if (this.isConnected && this.ws) {
      const payload = {
        type: 'subscribe',
        channel: channel
      };
      
      if (channel === 'marketdata') payload.symbol = symbolOrAccount;
      else payload.account = symbolOrAccount;
      
      this.ws.send(JSON.stringify(payload));
    }
  }

  on(channel, callback) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
    };
  }

  _notifyListeners(channel, data) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach(cb => cb(data));
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  }
}

// Export a singleton instance
export const wsClient = new TradingWebSocket();
