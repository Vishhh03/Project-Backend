// Simple utility functions
const Utils = {
    // DOM helpers
    $(selector) {
        return document.querySelector(selector);
    },
    
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Show/hide loading
    showLoading() {
        const app = this.$('#app');
        app.innerHTML = `
            <div class="container">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        `;
    },
    
    // Show error message
    showError(message) {
        const app = this.$('#app');
        app.innerHTML = `
            <div class="container">
                <div class="text-center">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
                </div>
            </div>
        `;
    },
    
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },
    
    // Format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN');
    },
    
    // Simple toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#dc2626' : '#059669'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);