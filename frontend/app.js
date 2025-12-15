// Import all components
import themeManager from './components/theme.js';
import websocketManager from './components/websocket.js';
import Dashboard from './components/dashboard.js';
import CallHistory from './components/call-history.js';
import Tickets from './components/tickets.js';
import CustomerLookup from './components/customer-lookup.js';
import CallPlayback from './components/call-playback.js';

// Global application state
window.DashboardApp = {
    // Components
    themeManager,
    websocketManager,
    dashboard,
    callHistory,
    tickets,
    customerLookup,
    callPlayback,
    
    // Current section
    currentSection: 'dashboard',
    
    // Initialization status
    initialized: false,
    
    // Notification system
    notifications: new Set(),
    
    /**
     * Initialize the dashboard application
     */
    async init() {
        if (this.initialized) return;
        
        console.log('🚀 Initializing Dashboard Application...');
        
        try {
            // Initialize theme manager first
            await this.initializeTheme();
            
            // Set up global functions and UI
            this.setupGlobalFunctions();
            this.setupNavigation();
            this.setupNotifications();
            
            // Initialize components
            await this.initializeComponents();
            
            // Connect WebSocket
            await this.initializeWebSocket();
            
            // Show welcome notification
            this.showNotification('Dashboard loaded successfully', 'success');
            
            this.initialized = true;
            console.log('✅ Dashboard Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Dashboard Application:', error);
            this.showNotification('Failed to initialize dashboard', 'error');
        }
    },
    
    /**
     * Initialize theme management
     */
    async initializeTheme() {
        // Try to load saved theme or follow system preference
        const savedTheme = localStorage.getItem('dashboard-theme');
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            themeManager.switchTheme(savedTheme);
        } else {
            themeManager.followSystemTheme();
        }
        
        // Initialize theme toggle in UI
        themeManager.initializeThemeToggle();
    },
    
    /**
     * Set up global functions for external access
     */
    setupGlobalFunctions() {
        // Global notification function
        window.showNotification = (message, type = 'info') => {
            this.showNotification(message, type);
        };
        
        // Navigation function
        window.navigateToSection = (sectionName) => {
            this.showSection(sectionName);
        };
        
        // Global play call recording function (as mentioned in the ticket)
        window.playCallRecording = (audioUrl, callId, callData) => {
            this.callPlayback.playRecording(audioUrl, callId, callData);
            this.showSection('callPlayback');
        };
        
        // Make components globally accessible for modal callbacks
        window.dashboardComponent = this.dashboard;
        window.callHistoryComponent = this.callHistory;
        window.ticketsComponent = this.tickets;
        window.customerLookupComponent = this.customerLookup;
        window.callPlaybackComponent = this.callPlayback;
    },
    
    /**
     * Set up navigation between sections
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionName = e.target.dataset.section;
                if (sectionName) {
                    this.showSection(sectionName);
                }
            });
        });
    },
    
    /**
     * Show specific section and hide others
     * @param {string} sectionName - Section to show
     */
    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.dashboard-section, .call-history-section, .tickets-section, .customer-lookup-section, .call-playback-section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Update navigation
        this.updateNavigation(sectionName);
        
        // Update current section
        this.currentSection = sectionName;
        
        console.log(`📋 Switched to section: ${sectionName}`);
    },
    
    /**
     * Update navigation active state
     * @param {string} activeSection - Active section name
     */
    updateNavigation(activeSection) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === activeSection) {
                link.classList.add('active');
            }
        });
    },
    
    /**
     * Set up notifications system
     */
    setupNotifications() {
        // Create notifications container if it doesn't exist
        let container = document.getElementById('notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications';
            container.className = 'notifications-container';
            container.style.cssText = `
                position: fixed;
                top: 90px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
    },
    
    /**
     * Initialize all components
     */
    async initializeComponents() {
        console.log('🔧 Initializing components...');
        
        // Initialize dashboard
        await this.dashboard.init();
        
        // Initialize call history
        await this.callHistory.init();
        
        // Initialize tickets
        await this.tickets.init();
        
        // Initialize customer lookup
        await this.customerLookup.init();
        
        // Initialize call playback
        await this.callPlayback.init();
        
        console.log('✅ All components initialized');
    },
    
    /**
     * Initialize WebSocket connection
     */
    async initializeWebSocket() {
        // Add connection status listeners
        this.websocketManager.addConnectionListener((state, event) => {
            this.updateConnectionStatus(state);
        });
        
        // Add message listeners
        this.websocketManager.addMessageListener((data) => {
            this.handleWebSocketMessage(data);
        });
        
        try {
            await this.websocketManager.connect('/ws');
        } catch (error) {
            console.warn('WebSocket connection failed:', error);
        }
    },
    
    /**
     * Update connection status display
     * @param {string} state - Connection state
     */
    updateConnectionStatus(state) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;
        
        switch (state) {
            case 'connected':
                statusElement.textContent = 'Connected';
                statusElement.className = 'connection-status';
                break;
            case 'connecting':
                statusElement.textContent = 'Connecting...';
                statusElement.className = 'connection-status';
                break;
            case 'disconnected':
                statusElement.textContent = 'Disconnected';
                statusElement.className = 'connection-status disconnected';
                break;
            case 'error':
                statusElement.textContent = 'Connection Error';
                statusElement.className = 'connection-status disconnected';
                break;
            default:
                statusElement.textContent = 'Unknown';
                statusElement.className = 'connection-status disconnected';
        }
    },
    
    /**
     * Handle incoming WebSocket messages
     * @param {Object} data - Message data
     */
    handleWebSocketMessage(data) {
        console.log('📡 WebSocket message received:', data);
        
        switch (data.type) {
            case 'dashboard_update':
                // Update dashboard with new data
                if (data.analytics) {
                    this.dashboard.updateAnalyticsCards(data.analytics);
                }
                break;
                
            case 'call_update':
                // Refresh call history if currently viewing
                if (this.currentSection === 'callHistory') {
                    this.callHistory.loadCallHistory();
                }
                break;
                
            case 'ticket_update':
                // Refresh tickets if currently viewing
                if (this.currentSection === 'tickets') {
                    this.tickets.loadTickets();
                }
                break;
                
            case 'notification':
                // Show notification from server
                this.showNotification(data.message, data.level || 'info');
                break;
                
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    },
    
    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            margin-bottom: 0.5rem;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            justify-content: space-between;
            align-items: center;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                margin-left: 1rem;
            ">×</button>
        `;
        
        container.appendChild(notification);
        this.notifications.add(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
                this.notifications.delete(notification);
            }
        }, 5000);
    },
    
    /**
     * Get notification color by type
     * @param {string} type - Notification type
     * @returns {string} Color hex code
     */
    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#27ae60';
            case 'error': return '#e74c3c';
            case 'warning': return '#f39c12';
            case 'info': 
            default: return '#3498db';
        }
    },
    
    /**
     * Refresh current section data
     */
    async refreshCurrentSection() {
        console.log(`🔄 Refreshing current section: ${this.currentSection}`);
        
        switch (this.currentSection) {
            case 'dashboard':
                await this.dashboard.refreshDashboard();
                break;
            case 'callHistory':
                await this.callHistory.refreshCallHistory();
                break;
            case 'tickets':
                await this.tickets.refreshTickets();
                break;
            case 'customerLookup':
                await this.customerLookup.loadRecentCustomers();
                break;
            default:
                console.log('No refresh logic for section:', this.currentSection);
        }
    },
    
    /**
     * Get application state
     * @returns {Object} Application state
     */
    getState() {
        return {
            currentSection: this.currentSection,
            initialized: this.initialized,
            websocketState: this.websocketManager.getState(),
            isWebSocketConnected: this.websocketManager.isConnected(),
            theme: this.themeManager.getCurrentTheme()
        };
    },
    
    /**
     * Clean up application
     */
    destroy() {
        console.log('🧹 Cleaning up Dashboard Application...');
        
        // Clean up components
        this.dashboard.destroy();
        this.callHistory.destroy();
        this.tickets.destroy();
        this.customerLookup.destroy();
        this.callPlayback.destroy();
        
        // Disconnect WebSocket
        this.websocketManager.disconnect();
        
        // Clear notifications
        this.notifications.forEach(notification => {
            if (notification.parentElement) {
                notification.remove();
            }
        });
        this.notifications.clear();
        
        this.initialized = false;
        console.log('✅ Dashboard Application cleaned up');
    }
};

// Create component instances
const dashboard = new Dashboard();
const callHistory = new CallHistory();
const tickets = new Tickets();
const customerLookup = new CustomerLookup();
const callPlayback = new CallPlayback();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DashboardApp.dashboard = dashboard;
        DashboardApp.callHistory = callHistory;
        DashboardApp.tickets = tickets;
        DashboardApp.customerLookup = customerLookup;
        DashboardApp.callPlayback = callPlayback;
        DashboardApp.init();
    });
} else {
    DashboardApp.dashboard = dashboard;
    DashboardApp.callHistory = callHistory;
    DashboardApp.tickets = tickets;
    DashboardApp.customerLookup = customerLookup;
    DashboardApp.callPlayback = callPlayback;
    DashboardApp.init();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    DashboardApp.destroy();
});

// Handle visibility change (for refreshing when tab becomes active)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && DashboardApp.initialized) {
        // Refresh data when user returns to the tab
        setTimeout(() => {
            DashboardApp.refreshCurrentSection();
        }, 1000);
    }
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notifications-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
`;
document.head.appendChild(style);

// Export for module usage
export default DashboardApp;