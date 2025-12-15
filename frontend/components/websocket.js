import { buildWsUrl } from './config.js';

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectInterval = 5000; // 5 seconds
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.connectionListeners = new Set();
        this.messageListeners = new Set();
        this.heartbeatInterval = null;
        this.heartbeatTimeout = null;
        this.reconnectTimeout = null;
    }

    /**
     * Connect to WebSocket server
     * @param {string} path - WebSocket path (default: '/ws')
     * @returns {Promise} Connection promise
     */
    connect(path = '/ws') {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return Promise.resolve();
        }

        this.isConnecting = true;
        
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = buildWsUrl(path);
                console.log('Connecting to WebSocket:', wsUrl);
                
                this.ws = new WebSocket(wsUrl);
                
                this.ws.onopen = (event) => {
                    console.log('WebSocket connected');
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.startHeartbeat();
                    this.notifyConnectionListeners('connected', event);
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };
                
                this.ws.onclose = (event) => {
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    this.isConnecting = false;
                    this.stopHeartbeat();
                    this.notifyConnectionListeners('disconnected', event);
                    
                    // Attempt to reconnect if not a clean close
                    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect();
                    }
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.isConnecting = false;
                    this.notifyConnectionListeners('error', error);
                    reject(error);
                };
                
            } catch (error) {
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        this.stopHeartbeat();
        
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
    }

    /**
     * Send message through WebSocket
     * @param {Object} data - Data to send
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
                return false;
            }
        } else {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }
    }

    /**
     * Handle incoming messages
     * @param {Event} event - Message event
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.notifyMessageListeners(data);
            
            // Handle heartbeat responses
            if (data.type === 'pong') {
                this.resetHeartbeatTimeout();
            }
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.stopHeartbeat();
        
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'ping' });
        }, 30000); // Send ping every 30 seconds
        
        this.resetHeartbeatTimeout();
    }

    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    /**
     * Reset heartbeat timeout
     */
    resetHeartbeatTimeout() {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
        }
        
        this.heartbeatTimeout = setTimeout(() => {
            console.warn('WebSocket heartbeat timeout, reconnecting...');
            this.disconnect();
            this.scheduleReconnect();
        }, 35000); // 35 seconds timeout (ping + 5s buffer)
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }
        
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
        
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }

    /**
     * Add connection state listener
     * @param {Function} callback - Callback function(state, event)
     */
    addConnectionListener(callback) {
        this.connectionListeners.add(callback);
    }

    /**
     * Remove connection state listener
     * @param {Function} callback - Callback function to remove
     */
    removeConnectionListener(callback) {
        this.connectionListeners.delete(callback);
    }

    /**
     * Add message listener
     * @param {Function} callback - Callback function(data)
     */
    addMessageListener(callback) {
        this.messageListeners.add(callback);
    }

    /**
     * Remove message listener
     * @param {Function} callback - Callback function to remove
     */
    removeMessageListener(callback) {
        this.messageListeners.delete(callback);
    }

    /**
     * Notify connection listeners
     * @param {string} state - Connection state
     * @param {Event} event - Related event
     */
    notifyConnectionListeners(state, event) {
        this.connectionListeners.forEach(callback => {
            try {
                callback(state, event);
            } catch (error) {
                console.error('Error in connection listener:', error);
            }
        });
    }

    /**
     * Notify message listeners
     * @param {Object} data - Message data
     */
    notifyMessageListeners(data) {
        this.messageListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in message listener:', error);
            }
        });
    }

    /**
     * Get connection state
     * @returns {string} Connection state
     */
    getState() {
        if (!this.ws) return 'disconnected';
        
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'connecting';
            case WebSocket.OPEN: return 'connected';
            case WebSocket.CLOSING: return 'closing';
            case WebSocket.CLOSED: return 'disconnected';
            default: return 'unknown';
        }
    }

    /**
     * Check if WebSocket is connected
     * @returns {boolean} True if connected
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Create singleton instance
const websocketManager = new WebSocketManager();

// Export both the class and instance
export default websocketManager;
export { WebSocketManager };