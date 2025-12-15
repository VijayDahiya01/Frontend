import { buildApiUrl } from './config.js';

class Dashboard {
    constructor() {
        this.analyticsData = {
            totalCalls: 0,
            activeTickets: 0,
            customerQueries: 0,
            avgDuration: 0
        };
        this.refreshInterval = null;
        this.isLoading = false;
    }

    /**
     * Initialize dashboard
     */
    async init() {
        console.log('Initializing Dashboard...');
        this.bindEvents();
        await this.loadDashboardData();
        this.startAutoRefresh();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Dashboard refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }
    }

    /**
     * Load dashboard data from API
     */
    async loadDashboardData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Load analytics data
            await this.loadAnalytics();
            
            // Load recent calls
            await this.loadRecentCalls();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showErrorState('Failed to load dashboard data');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * Load analytics data
     */
    async loadAnalytics() {
        try {
            const apiUrl = buildApiUrl('/dashboard/analytics');
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.updateAnalyticsCards(data);
            
        } catch (error) {
            console.warn('Failed to fetch analytics, using mock data:', error);
            this.updateAnalyticsCards(this.getMockAnalyticsData());
        }
    }

    /**
     * Update analytics cards with data
     * @param {Object} data - Analytics data
     */
    updateAnalyticsCards(data) {
        const {
            totalCalls = 0,
            activeTickets = 0,
            customerQueries = 0,
            avgDuration = 0
        } = data;
        
        // Update DOM elements
        const elements = {
            totalCalls: document.getElementById('totalCalls'),
            activeTickets: document.getElementById('activeTickets'),
            customerQueries: document.getElementById('customerQueries'),
            avgDuration: document.getElementById('avgDuration')
        };
        
        // Animate number updates
        this.animateNumber(elements.totalCalls, this.analyticsData.totalCalls, totalCalls);
        this.animateNumber(elements.activeTickets, this.analyticsData.activeTickets, activeTickets);
        this.animateNumber(elements.customerQueries, this.analyticsData.customerQueries, customerQueries);
        
        // Format duration
        elements.avgDuration.textContent = this.formatDuration(avgDuration);
        
        // Store current data
        this.analyticsData = { totalCalls, activeTickets, customerQueries, avgDuration };
        
        console.log('Analytics updated:', this.analyticsData);
    }

    /**
     * Load recent calls data
     */
    async loadRecentCalls() {
        try {
            const apiUrl = buildApiUrl('/dashboard/recent-calls');
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const calls = await response.json();
            this.updateRecentCallsList(calls);
            
        } catch (error) {
            console.warn('Failed to fetch recent calls, using mock data:', error);
            this.updateRecentCallsList(this.getMockRecentCalls());
        }
    }

    /**
     * Update recent calls list
     * @param {Array} calls - Recent calls data
     */
    updateRecentCallsList(calls) {
        // Find the call list container (this might be in a separate call-history component)
        const callList = document.getElementById('callList');
        if (!callList) return;
        
        if (!calls || calls.length === 0) {
            callList.innerHTML = '<div class="no-data">No recent calls</div>';
            return;
        }
        
        callList.innerHTML = calls.map(call => `
            <div class="call-item">
                <div class="call-header">
                    <span class="call-id">Call #${call.id}</span>
                    <span class="call-duration">${this.formatDuration(call.duration)}</span>
                </div>
                <div class="call-details">
                    <p><strong>Customer:</strong> ${call.customer || 'Unknown'}</p>
                    <p><strong>Agent:</strong> ${call.agent || 'Unknown'}</p>
                    <p><strong>Status:</strong> ${call.status || 'Completed'}</p>
                    <p><strong>Date:</strong> ${this.formatDate(call.createdAt)}</p>
                </div>
            </div>
        `).join('');
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const cards = document.querySelectorAll('.analytics-card .stat-number');
        cards.forEach(card => {
            card.innerHTML = '<div class="loading"></div>';
        });
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(el => {
            const parent = el.parentElement;
            if (parent && parent.classList.contains('stat-number')) {
                parent.textContent = '0';
            }
            el.remove();
        });
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    showErrorState(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error notification';
        errorDiv.innerHTML = `
            <span>${message}</span>
            <button class="close-btn" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Insert at top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(errorDiv, mainContent.firstChild);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Animate number counting
     * @param {Element} element - DOM element
     * @param {number} from - Starting number
     * @param {number} to - Ending number
     * @param {number} duration - Animation duration in ms
     */
    animateNumber(element, from, to, duration = 1000) {
        if (!element) return;
        
        const start = Date.now();
        const difference = to - from;
        
        const animate = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const current = Math.round(from + (difference * easedProgress));
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    /**
     * Format duration in seconds to MM:SS
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        if (!date) return 'Unknown';
        
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard() {
        console.log('Refreshing dashboard...');
        await this.loadDashboardData();
        
        // Show success notification
        this.showNotification('Dashboard refreshed', 'success');
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-btn" onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to notifications container or create one
        let container = document.getElementById('notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Start auto-refresh interval
     */
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    /**
     * Stop auto-refresh interval
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Get mock analytics data for fallback
     * @returns {Object} Mock analytics data
     */
    getMockAnalyticsData() {
        return {
            totalCalls: Math.floor(Math.random() * 1000) + 500,
            activeTickets: Math.floor(Math.random() * 50) + 10,
            customerQueries: Math.floor(Math.random() * 200) + 100,
            avgDuration: Math.floor(Math.random() * 300) + 120
        };
    }

    /**
     * Get mock recent calls for fallback
     * @returns {Array} Mock recent calls
     */
    getMockRecentCalls() {
        return [
            {
                id: '1001',
                duration: 245,
                customer: 'John Doe',
                agent: 'Agent Smith',
                status: 'Completed',
                createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: '1002',
                duration: 189,
                customer: 'Jane Smith',
                agent: 'Agent Johnson',
                status: 'Completed',
                createdAt: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: '1003',
                duration: 367,
                customer: 'Bob Wilson',
                agent: 'Agent Brown',
                status: 'Completed',
                createdAt: new Date(Date.now() - 10800000).toISOString()
            }
        ];
    }

    /**
     * Clean up dashboard
     */
    destroy() {
        this.stopAutoRefresh();
        this.refreshInterval = null;
        this.analyticsData = {};
    }
}

// Export the Dashboard class
export default Dashboard;