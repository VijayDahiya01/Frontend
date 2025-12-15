import { buildApiUrl } from './config.js';

class CustomerLookup {
    constructor() {
        this.customers = [];
        this.isLoading = false;
        this.currentSearch = '';
        this.searchTimeout = null;
    }

    /**
     * Initialize customer lookup
     */
    async init() {
        console.log('Initializing Customer Lookup...');
        this.bindEvents();
        this.loadRecentCustomers();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search button
        const searchBtn = document.getElementById('searchCustomer');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }

        // Search input
        const searchInput = document.getElementById('customerSearch');
        if (searchInput) {
            // Search on Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            
            // Real-time search with debouncing
            searchInput.addEventListener('input', () => {
                this.debouncedSearch();
            });
        }

        // Advanced search toggle
        const advancedToggle = document.getElementById('advancedSearchToggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('click', () => this.toggleAdvancedSearch());
        }
    }

    /**
     * Debounced search to avoid too many API calls
     */
    debouncedSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            const searchInput = document.getElementById('customerSearch');
            if (searchInput && searchInput.value.length >= 2) {
                this.performSearch();
            }
        }, 500);
    }

    /**
     * Perform customer search
     */
    async performSearch() {
        const searchInput = document.getElementById('customerSearch');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.trim();
        if (searchTerm.length < 2) {
            this.showNotification('Please enter at least 2 characters to search', 'warning');
            return;
        }
        
        this.currentSearch = searchTerm;
        await this.searchCustomers(searchTerm);
    }

    /**
     * Search customers via API
     * @param {string} searchTerm - Search term
     */
    async searchCustomers(searchTerm) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Build search query with advanced filters if enabled
            const searchParams = new URLSearchParams({
                query: searchTerm,
                limit: '20'
            });
            
            // Add advanced search parameters if available
            const advancedForm = document.getElementById('advancedSearchForm');
            if (advancedForm && advancedForm.style.display !== 'none') {
                const formData = new FormData(advancedForm);
                for (const [key, value] of formData.entries()) {
                    if (value) {
                        searchParams.append(key, value);
                    }
                }
            }
            
            const apiUrl = buildApiUrl(`/customers/search?${searchParams.toString()}`);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.updateCustomerResults(data);
            
        } catch (error) {
            console.warn('Failed to fetch customers, using mock data:', error);
            this.updateCustomerResults(this.getMockCustomers(searchTerm));
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * Load recent customers
     */
    async loadRecentCustomers() {
        try {
            const apiUrl = buildApiUrl('/customers/recent?limit=10');
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.customers = data.customers || data;
            this.renderCustomerResults();
            
        } catch (error) {
            console.warn('Failed to fetch recent customers, using mock data:', error);
            this.customers = this.getMockCustomers('');
            this.renderCustomerResults();
        }
    }

    /**
     * Update customer results display
     * @param {Array} data - Customer data
     */
    updateCustomerResults(data) {
        this.customers = data.customers || data;
        this.renderCustomerResults();
        
        const resultCount = this.customers.length;
        const message = resultCount > 0 
            ? `Found ${resultCount} customer${resultCount !== 1 ? 's' : ''} for "${this.currentSearch}"`
            : `No customers found for "${this.currentSearch}"`;
        
        this.showNotification(message, resultCount > 0 ? 'success' : 'warning');
    }

    /**
     * Render customer results
     */
    renderCustomerResults() {
        const resultsContainer = document.getElementById('customerResults');
        if (!resultsContainer) return;
        
        if (!this.customers || this.customers.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-data">
                    <p>No customers found. Try a different search term.</p>
                </div>
            `;
            return;
        }
        
        resultsContainer.innerHTML = this.customers.map(customer => this.renderCustomerItem(customer)).join('');
        
        // Bind customer item events
        this.bindCustomerItemEvents();
    }

    /**
     * Render individual customer item
     * @param {Object} customer - Customer data
     * @returns {string} HTML string for customer item
     */
    renderCustomerItem(customer) {
        const createdDate = this.formatDate(customer.createdAt);
        const lastContact = this.formatDate(customer.lastContactDate);
        const totalCalls = customer.totalCalls || 0;
        const customerStatus = customer.status || 'Active';
        
        return `
            <div class="customer-item" data-customer-id="${customer.id}">
                <div class="customer-header">
                    <div class="customer-info">
                        <span class="customer-name">${customer.name || 'Unknown Name'}</span>
                        <span class="customer-email">${customer.email || 'No email'}</span>
                        <span class="customer-phone">${customer.phone || 'No phone'}</span>
                        <span class="customer-status status-${customerStatus.toLowerCase()}">${customerStatus}</span>
                    </div>
                    <div class="customer-actions">
                        <button class="btn-view-customer" data-customer-id="${customer.id}" title="View details">
                            👁️
                        </button>
                        <button class="btn-edit-customer" data-customer-id="${customer.id}" title="Edit customer">
                            ✏️
                        </button>
                        <button class="btn-create-ticket" data-customer-id="${customer.id}" title="Create ticket">
                            🎫
                        </button>
                        <button class="btn-call-customer" data-customer-id="${customer.id}" title="Call customer">
                            📞
                        </button>
                    </div>
                </div>
                <div class="customer-details">
                    <div class="detail-row">
                        <span class="detail-label">Customer ID:</span>
                        <span class="detail-value">${customer.id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Calls:</span>
                        <span class="detail-value">${totalCalls}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Last Contact:</span>
                        <span class="detail-value">${lastContact}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${createdDate}</span>
                    </div>
                    ${customer.notes ? `
                    <div class="detail-row">
                        <span class="detail-label">Notes:</span>
                        <span class="detail-value">${this.truncateText(customer.notes, 150)}</span>
                    </div>
                    ` : ''}
                    ${customer.address ? `
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${customer.address}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Bind customer item event listeners
     */
    bindCustomerItemEvents() {
        // View customer buttons
        const viewButtons = document.querySelectorAll('.btn-view-customer');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const customerId = e.target.dataset.customerId;
                this.viewCustomer(customerId);
            });
        });
        
        // Edit customer buttons
        const editButtons = document.querySelectorAll('.btn-edit-customer');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const customerId = e.target.dataset.customerId;
                this.editCustomer(customerId);
            });
        });
        
        // Create ticket buttons
        const ticketButtons = document.querySelectorAll('.btn-create-ticket');
        ticketButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const customerId = e.target.dataset.customerId;
                this.createTicketForCustomer(customerId);
            });
        });
        
        // Call customer buttons
        const callButtons = document.querySelectorAll('.btn-call-customer');
        callButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const customerId = e.target.dataset.customerId;
                this.initiateCall(customerId);
            });
        });
    }

    /**
     * Toggle advanced search form
     */
    toggleAdvancedSearch() {
        const advancedForm = document.getElementById('advancedSearchForm');
        if (advancedForm) {
            const isVisible = advancedForm.style.display !== 'none';
            advancedForm.style.display = isVisible ? 'none' : 'block';
            
            const toggleBtn = document.getElementById('advancedSearchToggle');
            if (toggleBtn) {
                toggleBtn.textContent = isVisible ? 'Show Advanced Search' : 'Hide Advanced Search';
            }
        }
    }

    /**
     * View customer details
     * @param {string} customerId - Customer ID
     */
    viewCustomer(customerId) {
        const customer = this.customers.find(c => c.id.toString() === customerId.toString());
        if (!customer) return;
        
        // Create customer details modal
        const modalHtml = `
            <div class="modal" id="viewCustomerModal">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3>Customer Details - ${customer.name}</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="customer-details-view">
                            <div class="detail-section">
                                <h4>Contact Information</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Name:</strong>
                                        <span>${customer.name}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Email:</strong>
                                        <span>${customer.email || 'Not provided'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Phone:</strong>
                                        <span>${customer.phone || 'Not provided'}</span>
                                    </div>
                                    <div class="detail-item">
                                        <strong>Status:</strong>
                                        <span class="customer-status status-${customer.status?.toLowerCase()}">${customer.status || 'Active'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="detail-section">
                                <h4>Call History Summary</h4>
                                <div class="call-summary">
                                    <div class="summary-item">
                                        <span class="summary-label">Total Calls:</span>
                                        <span class="summary-value">${customer.totalCalls || 0}</span>
                                    </div>
                                    <div class="summary-item">
                                        <span class="summary-label">Avg Duration:</span>
                                        <span class="summary-value">${this.formatDuration(customer.avgCallDuration || 0)}</span>
                                    </div>
                                    <div class="summary-item">
                                        <span class="summary-label">Last Contact:</span>
                                        <span class="summary-value">${this.formatDate(customer.lastContactDate)}</span>
                                    </div>
                                </div>
                            </div>
                            ${customer.address ? `
                            <div class="detail-section">
                                <h4>Address</h4>
                                <p>${customer.address}</p>
                            </div>
                            ` : ''}
                            ${customer.notes ? `
                            <div class="detail-section">
                                <h4>Notes</h4>
                                <p>${customer.notes}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="customerLookup.editCustomer('${customer.id}')">Edit Customer</button>
                        <button class="btn-primary" onclick="customerLookup.createTicketForCustomer('${customer.id}')">Create Ticket</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Bind modal events
        const modal = document.getElementById('viewCustomerModal');
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeModal('viewCustomerModal'));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('viewCustomerModal');
            }
        });
    }

    /**
     * Edit customer
     * @param {string} customerId - Customer ID
     */
    editCustomer(customerId) {
        this.showNotification(`Edit functionality for customer #${customerId} would be implemented here`, 'info');
    }

    /**
     * Create ticket for customer
     * @param {string} customerId - Customer ID
     */
    createTicketForCustomer(customerId) {
        // Switch to tickets tab and trigger create ticket with customer context
        this.showNotification(`Create ticket for customer #${customerId} - navigation to tickets section`, 'info');
        
        // Close any open modals
        this.closeModal('viewCustomerModal');
        
        // In a real implementation, this would navigate to the tickets section
        // and pre-populate the customer field
        if (window.navigateToSection) {
            window.navigateToSection('tickets');
            if (window.ticketsComponent) {
                setTimeout(() => {
                    window.ticketsComponent.showCreateTicketModal(customerId);
                }, 100);
            }
        }
    }

    /**
     * Initiate call to customer
     * @param {string} customerId - Customer ID
     */
    initiateCall(customerId) {
        const customer = this.customers.find(c => c.id.toString() === customerId.toString());
        if (!customer || !customer.phone) {
            this.showNotification('Customer phone number not available', 'error');
            return;
        }
        
        this.showNotification(`Initiating call to ${customer.name} (${customer.phone})`, 'info');
        
        // In a real implementation, this would integrate with a phone system
        // For now, we'll just show the notification
        console.log(`Initiating call to customer ${customerId}: ${customer.name} at ${customer.phone}`);
    }

    /**
     * Close modal
     * @param {string} modalId - Modal ID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const resultsContainer = document.getElementById('customerResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="loading">Searching customers...</div>';
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
        if (!date) return 'Never';
        
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Get mock customers for fallback
     * @param {string} searchTerm - Search term
     * @returns {Array} Mock customer data
     */
    getMockCustomers(searchTerm = '') {
        const mockCustomers = [
            {
                id: '1',
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1-555-0101',
                address: '123 Main St, Anytown, USA 12345',
                status: 'Active',
                totalCalls: 15,
                avgCallDuration: 245,
                lastContactDate: new Date(Date.now() - 86400000).toISOString(),
                createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
                notes: 'Preferred customer, always polite and patient.'
            },
            {
                id: '2',
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+1-555-0102',
                address: '456 Oak Ave, Somewhere, USA 12346',
                status: 'Active',
                totalCalls: 8,
                avgCallDuration: 189,
                lastContactDate: new Date(Date.now() - 172800000).toISOString(),
                createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
                notes: 'Interested in premium services.'
            },
            {
                id: '3',
                name: 'Bob Johnson',
                email: 'bob.johnson@example.com',
                phone: '+1-555-0103',
                status: 'Inactive',
                totalCalls: 3,
                avgCallDuration: 67,
                lastContactDate: new Date(Date.now() - 30 * 86400000).toISOString(),
                createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
                notes: 'Customer has been unresponsive lately.'
            }
        ];
        
        // Filter based on search term if provided
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return mockCustomers.filter(customer => 
                customer.name.toLowerCase().includes(term) ||
                customer.email.toLowerCase().includes(term) ||
                customer.phone.includes(searchTerm)
            );
        }
        
        return mockCustomers;
    }

    /**
     * Clean up customer lookup component
     */
    destroy() {
        this.customers = [];
        this.currentSearch = '';
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
}

// Export the CustomerLookup class
export default CustomerLookup;