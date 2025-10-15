// Reusable UI Components

const Components = {
    // Hotel Card
    hotelCard(hotel) {
        return `
            <div class="hotel-card" onclick="Router.navigate('/hotels/${hotel.id}')">
                <div class="hotel-image">
                    <img src="https://picsum.photos/600/400?random=${hotel.id}" alt="${Utils.escapeHtml(hotel.name)}">
                    <div class="hotel-badge">${hotel.availableRooms} rooms</div>
                </div>
                <div class="hotel-content">
                    <h3 class="hotel-title">${Utils.escapeHtml(hotel.name)}</h3>
                    <div class="hotel-location">
                        📍 ${Utils.escapeHtml(hotel.city || hotel.address)}
                    </div>
                    <div class="hotel-rating">
                        <span class="stars">${Utils.generateStars(hotel.rating || 0)}</span>
                        <span class="rating-text">${(hotel.rating || 0).toFixed(1)}</span>
                    </div>
                    <div class="hotel-price">
                        <div>
                            <div class="price-amount">${Utils.formatCurrency(hotel.pricePerNight)}</div>
                            <div class="price-label">per night</div>
                        </div>
                        <button class="btn btn-primary" onclick="event.stopPropagation(); Router.navigate('/hotels/${hotel.id}')">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Booking Card
    bookingCard(booking) {
        const statusColors = {
            'Confirmed': 'success',
            'Cancelled': 'error',
            'Completed': 'primary'
        };
        
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">${Utils.escapeHtml(booking.hotelName || 'Hotel')}</h3>
                        <p class="text-secondary">${Utils.escapeHtml(booking.guestEmail)}</p>
                    </div>
                    <span class="badge badge-${statusColors[booking.status] || 'primary'}">
                        ${booking.status}
                    </span>
                </div>
                <div class="card-body">
                    <div class="grid grid-2">
                        <div>
                            <strong>Check-in:</strong><br>
                            ${Utils.formatDate(booking.checkInDate)}
                        </div>
                        <div>
                            <strong>Check-out:</strong><br>
                            ${Utils.formatDate(booking.checkOutDate)}
                        </div>
                        <div>
                            <strong>Guests:</strong><br>
                            ${booking.numberOfGuests}
                        </div>
                        <div>
                            <strong>Total:</strong><br>
                            <span class="price-amount" style="font-size: 1.5rem;">${Utils.formatCurrency(booking.totalAmount)}</span>
                        </div>
                    </div>
                    <div class="mt-3" style="display: flex; gap: 1rem;">
                        <button class="btn btn-secondary" onclick="Router.navigate('/bookings/${booking.id}')">
                            View Details
                        </button>
                        ${booking.status === 'Confirmed' ? `
                            <button class="btn btn-accent" onclick="App.cancelBooking(${booking.id})">
                                Cancel Booking
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    // Review Card
    reviewCard(review) {
        return `
            <div class="card">
                <div class="card-header">
                    <div>
                        <strong>${Utils.escapeHtml(review.userName || 'Guest')}</strong>
                        <div class="stars">${Utils.generateStars(review.rating)}</div>
                    </div>
                    <span class="text-secondary">${Utils.formatDate(review.createdAt)}</span>
                </div>
                <div class="card-body">
                    <p>${Utils.escapeHtml(review.comment)}</p>
                </div>
            </div>
        `;
    },

    // Loading Skeleton
    loadingSkeleton(count = 3) {
        return Array(count).fill(0).map(() => `
            <div class="card">
                <div class="skeleton" style="height: 200px; margin-bottom: 1rem;"></div>
                <div class="skeleton" style="height: 24px; width: 70%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton" style="height: 20px; width: 50%;"></div>
            </div>
        `).join('');
    },

    // Empty State
    emptyState(message, icon = '📭') {
        return `
            <div class="text-center p-4">
                <div style="font-size: 4rem; margin-bottom: 1rem;">${icon}</div>
                <h3>${message}</h3>
            </div>
        `;
    },

    // Modal
    modal(title, content, footer = '') {
        return `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            </div>
        `;
    },

    // Application Status Badge
    applicationStatusBadge(status) {
        const badges = {
            'Pending': 'badge-pending',
            'Approved': 'badge-success',
            'Rejected': 'badge-accent',
            'RequiresMoreInfo': 'badge-warning'
        };
        return `<span class="badge ${badges[status] || 'badge-primary'}">${status}</span>`;
    }
};
