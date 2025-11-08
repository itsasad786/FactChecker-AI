// Reports Hub JavaScript Functionality

let allReports = [];
let filteredReports = [];

// Load reports on page load
document.addEventListener('DOMContentLoaded', function() {
    loadReports();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterReports);
    }
    
    // Filter selects
    const categoryFilter = document.getElementById('category-filter');
    const threatFilter = document.getElementById('threat-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterReports);
    }
    if (threatFilter) {
        threatFilter.addEventListener('change', filterReports);
    }
    if (sortFilter) {
        sortFilter.addEventListener('change', filterReports);
    }
}

// Load reports from localStorage
function loadReports() {
    const saved = localStorage.getItem('submittedReports');
    if (saved) {
        try {
            allReports = JSON.parse(saved);
            filteredReports = [...allReports];
            updateStatistics();
            displayReports();
        } catch (error) {
            console.error('Error loading reports:', error);
            allReports = [];
            filteredReports = [];
            displayReports();
        }
    } else {
        allReports = [];
        filteredReports = [];
        displayReports();
    }
}

// Update statistics
function updateStatistics() {
    const totalReports = allReports.length;
    const highThreatReports = allReports.filter(r => r.threat?.level === 'high').length;
    const categories = new Set(allReports.map(r => r.threat?.category || 'general')).size;
    
    // Count reports from this month
    const now = new Date();
    const thisMonth = allReports.filter(r => {
        const reportDate = new Date(r.submittedAt || r.timestamp);
        return reportDate.getMonth() === now.getMonth() && 
               reportDate.getFullYear() === now.getFullYear();
    }).length;
    
    document.getElementById('total-reports').textContent = totalReports;
    document.getElementById('high-threat-reports').textContent = highThreatReports;
    document.getElementById('categories-count').textContent = categories;
    document.getElementById('recent-reports').textContent = thisMonth;
}

// Filter reports
function filterReports() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const threatFilter = document.getElementById('threat-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;
    
    filteredReports = allReports.filter(report => {
        // Search filter
        const matchesSearch = !searchTerm || 
            report.reportId.toLowerCase().includes(searchTerm) ||
            (report.authority?.name || '').toLowerCase().includes(searchTerm) ||
            (report.content || '').toLowerCase().includes(searchTerm);
        
        // Category filter
        const matchesCategory = categoryFilter === 'all' || 
            (report.threat?.category || 'general') === categoryFilter;
        
        // Threat level filter
        const matchesThreat = threatFilter === 'all' || 
            (report.threat?.level || 'low') === threatFilter;
        
        return matchesSearch && matchesCategory && matchesThreat;
    });
    
    // Sort reports
    filteredReports.sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.timestamp);
        const dateB = new Date(b.submittedAt || b.timestamp);
        
        switch (sortFilter) {
            case 'newest':
                return dateB - dateA;
            case 'oldest':
                return dateA - dateB;
            case 'threat-high':
                const threatOrder = { high: 3, medium: 2, low: 1 };
                const threatA = threatOrder[a.threat?.level || 'low'] || 1;
                const threatB = threatOrder[b.threat?.level || 'low'] || 1;
                if (threatB !== threatA) return threatB - threatA;
                return dateB - dateA;
            default:
                return dateB - dateA;
        }
    });
    
    displayReports();
}

// Display reports
function displayReports() {
    const reportsList = document.getElementById('reports-list');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredReports.length === 0) {
        reportsList.innerHTML = '';
        if (allReports.length === 0) {
            reportsList.appendChild(emptyState);
        } else {
            reportsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-filter"></i>
                    </div>
                    <h3>No Reports Match Your Filters</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                    <button class="btn-primary" onclick="clearFilters()">
                        <i class="fas fa-times"></i>
                        Clear Filters
                    </button>
                </div>
            `;
        }
        return;
    }
    
    reportsList.innerHTML = '';
    
    filteredReports.forEach(report => {
        const reportCard = createReportCard(report);
        reportsList.appendChild(reportCard);
    });
}

// Create report card
function createReportCard(report) {
    const card = document.createElement('div');
    card.className = 'report-card';
    card.dataset.reportId = report.reportId;
    
    const threatLevel = report.threat?.level || 'low';
    const threatCategory = report.threat?.category || 'general';
    const authority = report.authority?.name || 'Unknown Authority';
    const organization = report.authority?.organization || '';
    const date = new Date(report.submittedAt || report.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const credibilityScore = report.analysis?.overallScore || 0;
    const reportIndex = filteredReports.indexOf(report);
    
    card.innerHTML = `
        <div class="report-header">
            <div>
                <div class="report-id">${report.reportId}</div>
            </div>
            <div class="report-date">
                <i class="fas fa-clock"></i>
                ${formattedDate}
            </div>
        </div>
        <div class="report-body">
            <div class="report-info-item">
                <div class="report-info-label">Authority</div>
                <div class="report-info-value">${authority}</div>
            </div>
            <div class="report-info-item">
                <div class="report-info-label">Threat Level</div>
                <div>
                    <span class="threat-badge ${threatLevel}">${threatLevel.toUpperCase()}</span>
                </div>
            </div>
            <div class="report-info-item">
                <div class="report-info-label">Category</div>
                <div>
                    <span class="category-badge">${threatCategory.toUpperCase()}</span>
                </div>
            </div>
            <div class="report-info-item">
                <div class="report-info-label">Credibility Score</div>
                <div class="report-info-value">${credibilityScore}/100</div>
            </div>
        </div>
        <div class="report-footer">
            <div class="report-authority">
                <i class="fas fa-building"></i>
                <span>${organization}</span>
            </div>
            <div class="report-actions" onclick="event.stopPropagation()">
                <button class="btn-icon" onclick="event.stopPropagation(); showReportDetailByIndex(${reportIndex})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-icon" onclick="event.stopPropagation(); exportSingleReportByIndex(${reportIndex})" title="Export">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add click handler for the entire card
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if (!e.target.closest('.report-actions')) {
            showReportDetail(report);
        }
    });
    
    return card;
}

// Show report detail by index (for onclick handlers)
function showReportDetailByIndex(index) {
    if (index >= 0 && index < filteredReports.length) {
        showReportDetail(filteredReports[index]);
    }
}

// Export report by index (for onclick handlers)
function exportSingleReportByIndex(index) {
    if (index >= 0 && index < filteredReports.length) {
        exportSingleReport(filteredReports[index]);
    }
}

// Show report detail modal
function showReportDetail(report) {
    const modal = document.getElementById('report-detail-modal');
    const content = document.getElementById('report-detail-content');
    
    const threatLevel = report.threat?.level || 'low';
    const threatCategory = report.threat?.category || 'general';
    const authority = report.authority || {};
    const date = new Date(report.submittedAt || report.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const entities = report.entities || {};
    const analysis = report.analysis || {};
    
    content.innerHTML = `
        <div class="report-detail-section">
            <h4><i class="fas fa-info-circle"></i> Report Information</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-item-label">Report ID</div>
                    <div class="detail-item-value">${report.reportId}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Submitted Date</div>
                    <div class="detail-item-value">${formattedDate}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Status</div>
                    <div class="detail-item-value">
                        <span class="threat-badge ${report.status || 'submitted'}">${(report.status || 'submitted').toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-detail-section">
            <h4><i class="fas fa-shield-alt"></i> Authority Details</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-item-label">Authority Name</div>
                    <div class="detail-item-value">${authority.name || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Organization</div>
                    <div class="detail-item-value">${authority.organization || 'N/A'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Category</div>
                    <div class="detail-item-value">
                        <span class="category-badge">${threatCategory.toUpperCase()}</span>
                    </div>
                </div>
            </div>
            ${report.authorityContact ? `
                <div style="margin-top: 1rem;">
                    <strong>Contact Information:</strong>
                    <div style="margin-top: 0.5rem; padding: 0.75rem; background: #f5f5f5; border-radius: 8px;">
                        ${report.authorityContact.portal ? `<p><i class="fas fa-globe"></i> Portal: <a href="${report.authorityContact.portal}" target="_blank">${report.authorityContact.portal}</a></p>` : ''}
                        ${report.authorityContact.email ? `<p><i class="fas fa-envelope"></i> Email: ${report.authorityContact.email}</p>` : ''}
                        ${report.authorityContact.phone ? `<p><i class="fas fa-phone"></i> Phone: ${report.authorityContact.phone}</p>` : ''}
                        ${report.authorityContact.whatsapp ? `<p><i class="fab fa-whatsapp"></i> WhatsApp: ${report.authorityContact.whatsapp}</p>` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="report-detail-section">
            <h4><i class="fas fa-exclamation-triangle"></i> Threat Assessment</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-item-label">Threat Level</div>
                    <div class="detail-item-value">
                        <span class="threat-badge ${threatLevel}">${threatLevel.toUpperCase()}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Category</div>
                    <div class="detail-item-value">
                        <span class="category-badge">${threatCategory.toUpperCase()}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Confidence</div>
                    <div class="detail-item-value">${Math.round((report.threat?.confidence || 0) * 100)}%</div>
                </div>
            </div>
        </div>
        
        <div class="report-detail-section">
            <h4><i class="fas fa-chart-line"></i> Analysis Results</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-item-label">Overall Credibility Score</div>
                    <div class="detail-item-value">${analysis.overallScore || 0}/100</div>
                </div>
                <div class="detail-item">
                    <div class="detail-item-label">Credibility Level</div>
                    <div class="detail-item-value">${analysis.credibilityLevel || 'N/A'}</div>
                </div>
            </div>
        </div>
        
        ${Object.keys(entities).length > 0 ? `
            <div class="report-detail-section">
                <h4><i class="fas fa-tags"></i> Extracted Entities</h4>
                <div class="entities-list">
                    ${entities.urls && entities.urls.length > 0 ? entities.urls.map(url => `<span class="entity-tag">URL: ${url}</span>`).join('') : ''}
                    ${entities.monetary && entities.monetary.length > 0 ? entities.monetary.map(amount => `<span class="entity-tag">Amount: ${amount}</span>`).join('') : ''}
                    ${entities.dates && entities.dates.length > 0 ? entities.dates.map(date => `<span class="entity-tag">Date: ${date}</span>`).join('') : ''}
                </div>
            </div>
        ` : ''}
        
        <div class="report-detail-section">
            <h4><i class="fas fa-file-alt"></i> Reported Content</h4>
            <div class="content-preview">${(report.content || 'Content not available').substring(0, 1000)}${(report.content || '').length > 1000 ? '...' : ''}</div>
        </div>
    `;
    
    modal.style.display = 'block';
    window.currentReport = report;
}

// Close report detail modal
function closeReportDetailModal() {
    document.getElementById('report-detail-modal').style.display = 'none';
    window.currentReport = null;
}

// Export single report
function exportSingleReport(report) {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${report.reportId}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Report exported successfully!', 'success');
}

// Export all reports
function exportAllReports() {
    if (allReports.length === 0) {
        showNotification('No reports to export', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(allReports, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `all-reports-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('All reports exported successfully!', 'success');
}

// Export current report (from modal)
function exportReport() {
    if (window.currentReport) {
        exportSingleReport(window.currentReport);
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = 'all';
    document.getElementById('threat-filter').value = 'all';
    document.getElementById('sort-filter').value = 'newest';
    filterReports();
}

// Refresh reports
function refreshReports() {
    loadReports();
    showNotification('Reports refreshed!', 'success');
}

// Show notification (reuse from veritas-script.js if available, otherwise create simple one)
function showNotification(message, type = 'info') {
    // Try to use existing notification system
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 10000;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('report-detail-modal');
    if (event.target === modal) {
        closeReportDetailModal();
    }
}

