import { buildApiUrl } from './config.js';

class CallHistory {
    constructor() {
        this.calls = [];
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 1;
        this.isLoading = false;
        this.filters = {
            dateFrom: '',
            dateTo: '',
            status: '',
            agent: '',
            customer: ''
        };
    }

    /**
     * Initialize call history
     */
    async init() {
        console.log('Initializing Call History...');
        this.bindEvents();
        await this.loadCallHistory();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshCallHistory');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCallHistory());
        }

        // Search and filter events
        this.bindFilterEvents();
        
        // Pagination events
        this.bindPaginationEvents();
    }

    /**
     * Bind filter event listeners
     */
    bindFilterEvents() {
        // Date range filters
        const dateFromInput = document.getElementById('callDateFrom');
        const dateToInput = document.getElementById('callDateTo');
        
        if (dateFromInput) {
            dateFromInput.addEventListener('change', () => {
                this.filters.dateFrom = dateFromInput.value;
                this.currentPage = 1;
                this.loadCallHistory();
            });
        }
        
        if (dateToInput) {
            dateToInput.addEventListener('change', () => {
                this.filters.dateTo = dateToInput.value;
                this.currentPage = 1;
                this.loadCallHistory();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('callStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.currentPage = 1;
                this.loadCallHistory();
            });
        }

        // Search input
        const searchInput = document.getElementById('callSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.customer = searchInput.value;
                    this.currentPage = 1;
                    this.loadCallHistory();
                }, 500);
            });
        }
    }

    /**
     * Bind pagination event listeners
     */
    bindPaginationEvents() {
        // Pagination will be bound after pagination HTML is rendered
    }

    /**
     * Load call history from API
     */
    async loadCallHistory() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage.toString(),
                limit: this.pageSize.toString(),
                ...this.filters
            });
            
            // Remove empty filters
            Object.keys(this.filters).forEach(key => {
                if (!this.filters[key]) {
                    queryParams.delete(key);
                }
            });
            
            const apiUrl = buildApiUrl(`/call-history?${queryParams.toString()}`);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.updateCallHistory(data);
            
        } catch (error) {
            console.warn('Failed to fetch call history, using mock data:', error);
            this.updateCallHistory(this.getMockCallHistory());
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * Update call history display
     * @param {Object} data - Call history data
     */
    updateCallHistory(data) {
        // Handle both paginated and non-paginated responses
        if (data.calls) {
            this.calls = data.calls;
            this.totalPages = data.totalPages || 1;
            this.currentPage = data.currentPage || 1;
        } else {
            this.calls = data;
            this.totalPages = 1;
            this.currentPage = 1;
        }
        
        this.renderCallList();
        this.renderPagination();
        console.log(`Loaded ${this.calls.length} calls (page ${this.currentPage} of ${this.totalPages})`);
    }

    /**
     * Render call list
     */
    renderCallList() {
        const callList = document.getElementById('callList');
        if (!callList) return;
        
        if (!this.calls || this.calls.length === 0) {
            callList.innerHTML = `
                <div class="no-data">
                    <p>No calls found matching your criteria.</p>
                </div>
            `;
            return;
        }
        
        callList.innerHTML = this.calls.map(call => this.renderCallItem(call)).join('');
        
        // Bind call item events
        this.bindCallItemEvents();
    }

    /**
     * Render individual call item
     * @param {Object} call - Call data
     * @returns {string} HTML string for call item
     */
    renderCallItem(call) {
        const duration = this.formatDuration(call.duration);
        const date = this.formatDate(call.createdAt);
        const statusClass = `status-${call.status?.toLowerCase() || 'unknown'}`;
        
        return `
            <div class="call-item" data-call-id="${call.id}">
                <div class="call-header">
                    <div class="call-info">
                        <span class="call-id">#${call.id}</span>
                        <span class="call-duration">${duration}</span>
                        <span class="call-status ${statusClass}">${call.status || 'Unknown'}</span>
                    </div>
                    <div class="call-actions">
                        <button class="btn-play-recording" data-call-id="${call.id}" title="Play recording">
                            ▶️
                        </button>
                        <button class="btn-download-recording" data-call-id="${call.id}" title="Download recording">
                            💾
                        </button>
                    </div>
                </div>
                <div class="call-details">
                    <div class="detail-row">
                        <span class="detail-label">Customer:</span>
                        <span class="detail-value">${call.customer || 'Unknown'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Agent:</span>
                        <span class="detail-value">${call.agent || 'Unknown'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${date}</span>
                    </div>
                    ${call.notes ? `
                    <div class="detail-row">
                        <span class="detail-label">Notes:</span>
                        <span class="detail-value">${call.notes}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render pagination controls
     */
    renderPagination() {
        if (this.totalPages <= 1) return;
        
        let paginationHtml = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHtml += `
                <button class="page-btn" data-page="${this.currentPage - 1}">
                    ‹ Previous
                </button>
            `;
        }
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHtml += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span class="page-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage ? 'active' : '';
            paginationHtml += `
                <button class="page-btn ${isActive}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHtml += `<span class="page-ellipsis">...</span>`;
            }
            paginationHtml += `<button class="page-btn" data-page="${this.totalPages}">${this.totalPages}</button>`;
        }
        
        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHtml += `
                <button class="page-btn" data-page="${this.currentPage + 1}">
                    Next ›
                </button>
            `;
        }
        
        paginationHtml += '</div>';
        
        // Add pagination to call list container
        const callList = document.getElementById('callList');
        if (callList) {
            callList.insertAdjacentHTML('afterend', paginationHtml);
            
            // Bind pagination events
            const pageButtons = callList.parentElement.querySelectorAll('.page-btn');
            pageButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const page = parseInt(e.target.dataset.page);
                    if (page && page !== this.currentPage) {
                        this.currentPage = page;
                        this.loadCallHistory();
                        // Scroll to top of call list
                        callList.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        }
    }

    /**
     * Bind call item event listeners
     */
    bindCallItemEvents() {
        // Play recording buttons
        const playButtons = document.querySelectorAll('.btn-play-recording');
        playButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const callId = e.target.dataset.callId;
                this.playRecording(callId);
            });
        });
        
        // Download recording buttons
        const downloadButtons = document.querySelectorAll('.btn-download-recording');
        downloadButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const callId = e.target.dataset.callId;
                this.downloadRecording(callId);
            });
        });
    }

    /**
     * Play call recording
     * @param {string} callId - Call ID
     */
    async playRecording(callId) {
        try {
            const apiUrl = buildApiUrl(`/calls/${callId}/recording`);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            // Trigger global playback function if available
            if (window.playCallRecording) {
                window.playCallRecording(audioUrl, callId);
            } else {
                // Fallback: create audio element
                const audio = new Audio(audioUrl);
                audio.play();
            }
            
        } catch (error) {
            console.error('Failed to play recording:', error);
            this.showNotification('Failed to play recording', 'error');
        }
    }

    /**
     * Download call recording
     * @param {string} callId - Call ID
     */
    async downloadRecording(callId) {
        try {
            const apiUrl = buildApiUrl(`/calls/${callId}/recording`);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `call-${callId}-recording.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Recording download started', 'success');
            
        } catch (error) {
            console.error('Failed to download recording:', error);
            this.showNotification('Failed to download recording', 'error');
        }
    }

    /**
     * Refresh call history
     */
    async refreshCallHistory() {
        console.log('Refreshing call history...');
        this.currentPage = 1;
        await this.loadCallHistory();
        this.showNotification('Call history refreshed', 'success');
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const callList = document.getElementById('callList');
        if (callList) {
            callList.innerHTML = '<div class="loading">Loading call history...</div>';
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        // Loading state is hidden when data is rendered
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     */
    showNotification(message, type = 'info') {
        // This will be handled by the main app or dashboard component
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
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
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Get mock call history for fallback
     * @returns {Object} Mock call history data
     */
    getMockCallHistory() {
        const mockCalls = [];
        for (let i = 1; i <= 50; i++) {
            mockCalls.push({
                id: `100${i}`,
                duration: Math.floor(Math.random() * 600) + 60,
                customer: `Customer ${i}`,
                agent: `Agent ${(i % 5) + 1}`,
                status: ['Completed', 'Missed', 'Voicemail'][Math.floor(Math.random() * 3)],
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                notes: Math.random() > 0.7 ? `Call notes for call ${i}` : ''
            });
        }
        
        return {
            calls: mockCalls.slice(0, this.pageSize),
            totalPages: Math.ceil(mockCalls.length / this.pageSize),
            currentPage: this.currentPage
        };
    }

    /**
     * Clean up call history
     */
    destroy() {
        this.calls = [];
        this.filters = {};
        this.stopAutoRefresh();
    }

    /**
     * Start auto-refresh (if needed)
     */
    startAutoRefresh() {
        // Auto-refresh every 2 minutes
        setInterval(() => {
            if (!this.isLoading) {
                this.loadCallHistory();
            }
        }, 2 * 60 * 1000);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        // Implementation would clear any auto-refresh intervals
    }
}

// Export the CallHistory class
export default CallHistory;