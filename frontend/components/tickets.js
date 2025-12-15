import { buildApiUrl } from './config.js';

class Tickets {
    constructor() {
        this.tickets = [];
        this.currentPage = 1;
        this.pageSize = 15;
        this.totalPages = 1;
        this.isLoading = false;
        this.filters = {
            status: '',
            priority: '',
            assignee: '',
            search: ''
        };
        this.sortBy = 'createdAt';
        this.sortOrder = 'desc';
    }

    /**
     * Initialize tickets component
     */
    async init() {
        console.log('Initializing Tickets...');
        this.bindEvents();
        await this.loadTickets();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Create ticket button
        const createBtn = document.getElementById('createTicket');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateTicketModal());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshTickets');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshTickets());
        }

        // Filter events
        this.bindFilterEvents();
    }

    /**
     * Bind filter event listeners
     */
    bindFilterEvents() {
        // Status filter
        const statusFilter = document.getElementById('ticketStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.currentPage = 1;
                this.loadTickets();
            });
        }

        // Priority filter
        const priorityFilter = document.getElementById('ticketPriorityFilter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => {
                this.filters.priority = priorityFilter.value;
                this.currentPage = 1;
                this.loadTickets();
            });
        }

        // Search input
        const searchInput = document.getElementById('ticketSearchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = searchInput.value;
                    this.currentPage = 1;
                    this.loadTickets();
                }, 500);
            });
        }
    }

    /**
     * Load tickets from API
     */
    async loadTickets() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            const queryParams = new URLSearchParams({
                page: this.currentPage.toString(),
                limit: this.pageSize.toString(),
                sortBy: this.sortBy,
                sortOrder: this.sortOrder,
                ...this.filters
            });
            
            // Remove empty filters
            Object.keys(this.filters).forEach(key => {
                if (!this.filters[key]) {
                    queryParams.delete(key);
                }
            });
            
            const apiUrl = buildApiUrl(`/tickets?${queryParams.toString()}`);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.updateTickets(data);
            
        } catch (error) {
            console.warn('Failed to fetch tickets, using mock data:', error);
            this.updateTickets(this.getMockTickets());
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    /**
     * Update tickets display
     * @param {Object} data - Tickets data
     */
    updateTickets(data) {
        // Handle both paginated and non-paginated responses
        if (data.tickets) {
            this.tickets = data.tickets;
            this.totalPages = data.totalPages || 1;
            this.currentPage = data.currentPage || 1;
        } else {
            this.tickets = data;
            this.totalPages = 1;
            this.currentPage = 1;
        }
        
        this.renderTicketList();
        this.renderPagination();
        console.log(`Loaded ${this.tickets.length} tickets (page ${this.currentPage} of ${this.totalPages})`);
    }

    /**
     * Render ticket list
     */
    renderTicketList() {
        const ticketList = document.getElementById('ticketList');
        if (!ticketList) return;
        
        if (!this.tickets || this.tickets.length === 0) {
            ticketList.innerHTML = `
                <div class="no-data">
                    <p>No tickets found matching your criteria.</p>
                </div>
            `;
            return;
        }
        
        ticketList.innerHTML = this.tickets.map(ticket => this.renderTicketItem(ticket)).join('');
        
        // Bind ticket item events
        this.bindTicketItemEvents();
    }

    /**
     * Render individual ticket item
     * @param {Object} ticket - Ticket data
     * @returns {string} HTML string for ticket item
     */
    renderTicketItem(ticket) {
        const priorityClass = `priority-${ticket.priority?.toLowerCase() || 'medium'}`;
        const statusClass = `status-${ticket.status?.toLowerCase() || 'open'}`;
        const createdDate = this.formatDate(ticket.createdAt);
        const updatedDate = this.formatDate(ticket.updatedAt);
        
        return `
            <div class="ticket-item" data-ticket-id="${ticket.id}">
                <div class="ticket-header">
                    <div class="ticket-info">
                        <span class="ticket-id">#${ticket.id}</span>
                        <span class="ticket-title">${ticket.title || 'Untitled Ticket'}</span>
                        <span class="ticket-status ${statusClass}">${ticket.status || 'Open'}</span>
                        <span class="ticket-priority ${priorityClass}">${ticket.priority || 'Medium'}</span>
                    </div>
                    <div class="ticket-actions">
                        <button class="btn-view-ticket" data-ticket-id="${ticket.id}" title="View details">
                            👁️
                        </button>
                        <button class="btn-edit-ticket" data-ticket-id="${ticket.id}" title="Edit ticket">
                            ✏️
                        </button>
                        ${ticket.status !== 'Closed' ? `
                        <button class="btn-close-ticket" data-ticket-id="${ticket.id}" title="Close ticket">
                            ❌
                        </button>
                        ` : ''}
                    </div>
                </div>
                <div class="ticket-details">
                    <div class="detail-row">
                        <span class="detail-label">Customer:</span>
                        <span class="detail-value">${ticket.customer || 'Unknown'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Assignee:</span>
                        <span class="detail-value">${ticket.assignee || 'Unassigned'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">${createdDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Updated:</span>
                        <span class="detail-value">${updatedDate}</span>
                    </div>
                    ${ticket.description ? `
                    <div class="detail-row">
                        <span class="detail-label">Description:</span>
                        <span class="detail-value">${this.truncateText(ticket.description, 100)}</span>
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
        
        // Add pagination to ticket list container
        const ticketList = document.getElementById('ticketList');
        if (ticketList) {
            ticketList.insertAdjacentHTML('afterend', paginationHtml);
            
            // Bind pagination events
            const pageButtons = ticketList.parentElement.querySelectorAll('.page-btn');
            pageButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const page = parseInt(e.target.dataset.page);
                    if (page && page !== this.currentPage) {
                        this.currentPage = page;
                        this.loadTickets();
                        // Scroll to top of ticket list
                        ticketList.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
        }
    }

    /**
     * Bind ticket item event listeners
     */
    bindTicketItemEvents() {
        // View ticket buttons
        const viewButtons = document.querySelectorAll('.btn-view-ticket');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = e.target.dataset.ticketId;
                this.viewTicket(ticketId);
            });
        });
        
        // Edit ticket buttons
        const editButtons = document.querySelectorAll('.btn-edit-ticket');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = e.target.dataset.ticketId;
                this.editTicket(ticketId);
            });
        });
        
        // Close ticket buttons
        const closeButtons = document.querySelectorAll('.btn-close-ticket');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ticketId = e.target.dataset.ticketId;
                this.closeTicket(ticketId);
            });
        });
    }

    /**
     * Show create ticket modal
     */
    showCreateTicketModal() {
        // Create modal HTML
        const modalHtml = `
            <div class="modal" id="createTicketModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Create New Ticket</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="createTicketForm">
                            <div class="form-group">
                                <label for="ticketTitle">Title *</label>
                                <input type="text" id="ticketTitle" name="title" required>
                            </div>
                            <div class="form-group">
                                <label for="ticketCustomer">Customer</label>
                                <input type="text" id="ticketCustomer" name="customer">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="ticketPriority">Priority</label>
                                    <select id="ticketPriority" name="priority">
                                        <option value="Low">Low</option>
                                        <option value="Medium" selected>Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="ticketAssignee">Assignee</label>
                                    <input type="text" id="ticketAssignee" name="assignee">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="ticketDescription">Description</label>
                                <textarea id="ticketDescription" name="description" rows="4"></textarea>
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-cancel">Cancel</button>
                                <button type="submit" class="btn-primary">Create Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Bind modal events
        this.bindCreateTicketModalEvents();
    }

    /**
     * Bind create ticket modal events
     */
    bindCreateTicketModalEvents() {
        const modal = document.getElementById('createTicketModal');
        const form = document.getElementById('createTicketForm');
        const cancelBtn = modal.querySelector('.btn-cancel');
        const closeBtn = modal.querySelector('.modal-close');
        
        // Close modal events
        cancelBtn.addEventListener('click', () => this.closeModal('createTicketModal'));
        closeBtn.addEventListener('click', () => this.closeModal('createTicketModal'));
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('createTicketModal');
            }
        });
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createTicket(form);
        });
    }

    /**
     * Create new ticket
     * @param {HTMLFormElement} form - Form element
     */
    async createTicket(form) {
        const formData = new FormData(form);
        const ticketData = Object.fromEntries(formData.entries());
        
        try {
            const apiUrl = buildApiUrl('/tickets');
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ticketData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const newTicket = await response.json();
            
            // Add to local list and refresh
            this.tickets.unshift(newTicket);
            this.renderTicketList();
            this.closeModal('createTicketModal');
            this.showNotification('Ticket created successfully', 'success');
            
        } catch (error) {
            console.error('Failed to create ticket:', error);
            this.showNotification('Failed to create ticket', 'error');
        }
    }

    /**
     * View ticket details
     * @param {string} ticketId - Ticket ID
     */
    viewTicket(ticketId) {
        const ticket = this.tickets.find(t => t.id.toString() === ticketId.toString());
        if (!ticket) return;
        
        // Create view ticket modal
        const modalHtml = `
            <div class="modal" id="viewTicketModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Ticket #${ticket.id}</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="ticket-details-view">
                            <div class="detail-group">
                                <strong>Title:</strong>
                                <p>${ticket.title}</p>
                            </div>
                            <div class="detail-group">
                                <strong>Customer:</strong>
                                <p>${ticket.customer}</p>
                            </div>
                            <div class="detail-group">
                                <strong>Assignee:</strong>
                                <p>${ticket.assignee}</p>
                            </div>
                            <div class="detail-row">
                                <div class="detail-group">
                                    <strong>Status:</strong>
                                    <span class="ticket-status status-${ticket.status?.toLowerCase()}">${ticket.status}</span>
                                </div>
                                <div class="detail-group">
                                    <strong>Priority:</strong>
                                    <span class="ticket-priority priority-${ticket.priority?.toLowerCase()}">${ticket.priority}</span>
                                </div>
                            </div>
                            <div class="detail-group">
                                <strong>Description:</strong>
                                <p>${ticket.description || 'No description provided'}</p>
                            </div>
                            <div class="detail-row">
                                <div class="detail-group">
                                    <strong>Created:</strong>
                                    <p>${this.formatDate(ticket.createdAt)}</p>
                                </div>
                                <div class="detail-group">
                                    <strong>Updated:</strong>
                                    <p>${this.formatDate(ticket.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Bind modal events
        const modal = document.getElementById('viewTicketModal');
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeModal('viewTicketModal'));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal('viewTicketModal');
            }
        });
    }

    /**
     * Edit ticket
     * @param {string} ticketId - Ticket ID
     */
    editTicket(ticketId) {
        const ticket = this.tickets.find(t => t.id.toString() === ticketId.toString());
        if (!ticket) return;
        
        // Similar to create modal but pre-filled
        // For brevity, we'll just show a notification
        this.showNotification(`Edit functionality for ticket #${ticketId} would be implemented here`, 'info');
    }

    /**
     * Close ticket
     * @param {string} ticketId - Ticket ID
     */
    async closeTicket(ticketId) {
        if (!confirm('Are you sure you want to close this ticket?')) {
            return;
        }
        
        try {
            const apiUrl = buildApiUrl(`/tickets/${ticketId}`);
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'Closed' })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Update local data
            const ticketIndex = this.tickets.findIndex(t => t.id.toString() === ticketId.toString());
            if (ticketIndex !== -1) {
                this.tickets[ticketIndex].status = 'Closed';
                this.renderTicketList();
            }
            
            this.showNotification('Ticket closed successfully', 'success');
            
        } catch (error) {
            console.error('Failed to close ticket:', error);
            this.showNotification('Failed to close ticket', 'error');
        }
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
     * Refresh tickets
     */
    async refreshTickets() {
        console.log('Refreshing tickets...');
        await this.loadTickets();
        this.showNotification('Tickets refreshed', 'success');
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const ticketList = document.getElementById('ticketList');
        if (ticketList) {
            ticketList.innerHTML = '<div class="loading">Loading tickets...</div>';
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
     * Get mock tickets for fallback
     * @returns {Object} Mock tickets data
     */
    getMockTickets() {
        const mockTickets = [];
        const statuses = ['Open', 'In Progress', 'Closed'];
        const priorities = ['Low', 'Medium', 'High'];
        
        for (let i = 1; i <= 50; i++) {
            mockTickets.push({
                id: `T${1000 + i}`,
                title: `Sample Ticket ${i}`,
                description: `This is a sample ticket description for ticket number ${i}`,
                customer: `Customer ${i}`,
                assignee: `Agent ${(i % 5) + 1}`,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        
        return {
            tickets: mockTickets.slice(0, this.pageSize),
            totalPages: Math.ceil(mockTickets.length / this.pageSize),
            currentPage: this.currentPage
        };
    }

    /**
     * Clean up tickets component
     */
    destroy() {
        this.tickets = [];
        this.filters = {};
    }
}

// Export the Tickets class
export default Tickets;