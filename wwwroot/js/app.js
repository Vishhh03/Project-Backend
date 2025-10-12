// Main application
const App = {
  // Initialize the application
  init() {
    console.log("Initializing FinalDestination...");

    // Initialize modules
    Auth.init();
    this.setupRoutes();
    this.setupEventListeners();
    Router.init();

    console.log("FinalDestination initialized successfully!");
  },

  // Setup all routes
  setupRoutes() {
    // Home page
    Router.add("/", this.pages.home);

    // Hotels
    Router.add("/hotels", this.pages.hotels);
    Router.add("/hotels/:id", this.pages.hotelDetail);

    // Authentication
    Router.add("/login", this.pages.login);
    Router.add("/register", this.pages.register);
    Router.add("/profile", this.pages.profile);

    // Bookings
    Router.add("/bookings", this.pages.bookings);
  },

  // Setup event listeners
  setupEventListeners() {
    // Mobile menu toggle
    const mobileToggle = Utils.$("#mobile-toggle");
    const navLinks = Utils.$("#nav-links");

    mobileToggle?.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });

    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav") && navLinks.classList.contains("active")) {
        navLinks.classList.remove("active");
      }
    });
  },

  // Page components
  pages: {
    // Home page
    home() {
      const app = Utils.$("#app");
      app.innerHTML = `
                <div class="hero">
                    <div class="container">
                        <h1>Welcome to FinalDestination</h1>
                        <p>Discover amazing hotels and book your perfect stay</p>
                        <a href="#/hotels" class="btn btn-primary">Browse Hotels</a>
                    </div>
                </div>
                
                <div class="container">
                    <div class="text-center mb-3">
                        <h2>Why Choose Us?</h2>
                    </div>
                    
                    <div class="grid grid-3">
                        <div class="card">
                            <div class="card-content text-center">
                                <h3>🏨 Best Hotels</h3>
                                <p>Carefully selected hotels with excellent ratings and amenities</p>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-content text-center">
                                <h3>💰 Great Prices</h3>
                                <p>Competitive pricing with no hidden fees or booking charges</p>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-content text-center">
                                <h3>🎧 24/7 Support</h3>
                                <p>Round-the-clock customer support for all your booking needs</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    },

    // Hotels listing page
    async hotels() {
      Utils.showLoading();

      try {
        const hotels = await API.hotels.getAll();

        const app = Utils.$("#app");
        app.innerHTML = `
                    <div class="container">
                        <div class="mb-3">
                            <h1>Discover Amazing Hotels</h1>
                            <p class="text-center" style="color: #64748b; margin-bottom: 2rem;">Find your perfect stay from our curated collection</p>
                            
                            <div class="form-group">
                                <input type="text" id="search-input" class="form-input" placeholder="Search by hotel name, city, or amenities...">
                            </div>
                        </div>
                        
                        <div class="grid grid-3" id="hotels-grid">
                            ${hotels
                              .map(
                                (hotel) => `
                                <div class="card hotel-card" onclick="Router.navigate('/hotels/${
                                  hotel.id
                                }')">
                                    <div class="card-header">
                                        <img src="${hotel.image}" alt="${
                                  hotel.name
                                }">
                                        <div class="rating">⭐ ${
                                          hotel.rating
                                        }</div>
                                    </div>
                                    <div class="card-content">
                                        <h3>${hotel.name}</h3>
                                        <div class="location">📍 ${
                                          hotel.city
                                        }</div>
                                        <p>${hotel.description}</p>
                                        <div class="amenities">
                                            ${hotel.amenities
                                              .slice(0, 3)
                                              .map(
                                                (amenity) =>
                                                  `<span class="amenity-tag">${amenity}</span>`
                                              )
                                              .join("")}
                                            ${
                                              hotel.amenities.length > 3
                                                ? `<span class="amenity-tag">+${
                                                    hotel.amenities.length - 3
                                                  } more</span>`
                                                : ""
                                            }
                                        </div>
                                        <div class="price">${Utils.formatCurrency(
                                          hotel.pricePerNight
                                        )} <span style="font-weight: 400; font-size: 0.9rem; color: #6b7280;">per night</span></div>
                                        <button class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;" onclick="event.stopPropagation(); Router.navigate('/hotels/${
                                          hotel.id
                                        }')">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                        
                        <div class="text-center mt-3">
                            <p style="color: #6b7280;">Showing ${
                              hotels.length
                            } hotels</p>
                        </div>
                    </div>
                `;

        // Setup search functionality
        const searchInput = Utils.$("#search-input");
        searchInput.addEventListener("input", (e) => {
          const query = e.target.value.toLowerCase();
          const hotelCards = Utils.$$("#hotels-grid .hotel-card");
          let visibleCount = 0;

          hotelCards.forEach((card) => {
            const text = card.textContent.toLowerCase();
            const isVisible = text.includes(query);
            card.style.display = isVisible ? "block" : "none";
            if (isVisible) visibleCount++;
          });

          // Update count
          const countElement = Utils.$(".container p:last-child");
          if (countElement) {
            countElement.textContent = `Showing ${visibleCount} hotels`;
          }
        });
      } catch (error) {
        Utils.showError("Failed to load hotels. Please try again.");
      }
    },

    // Hotel detail page
    async hotelDetail(id) {
      Utils.showLoading();

      try {
        const hotel = await API.hotels.getById(parseInt(id));

        const app = Utils.$("#app");
        app.innerHTML = `
                    <div class="container">
                        <!-- Back button -->
                        <div class="mb-2">
                            <button class="btn btn-outline" onclick="Router.navigate('/hotels')" style="margin-bottom: 1rem;">
                                ← Back to Hotels
                            </button>
                        </div>
                        
                        <div class="grid grid-2" style="gap: 3rem;">
                            <div>
                                <img src="${hotel.image}" alt="${
          hotel.name
        }" style="width: 100%; border-radius: 0.75rem; margin-bottom: 1rem;">
                                
                                <!-- Amenities -->
                                <div class="card">
                                    <div class="card-content">
                                        <h3>Amenities</h3>
                                        <div class="amenities">
                                            ${hotel.amenities
                                              .map(
                                                (amenity) =>
                                                  `<span class="amenity-tag">${amenity}</span>`
                                              )
                                              .join("")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <div class="mb-2">
                                    <span class="rating" style="background: #059669; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600;">
                                        ⭐ ${hotel.rating} Excellent
                                    </span>
                                </div>
                                
                                <h1 style="margin-bottom: 0.5rem;">${
                                  hotel.name
                                }</h1>
                                <p class="location" style="font-size: 1.1rem; color: #6b7280; margin-bottom: 1rem;">📍 ${
                                  hotel.city
                                }</p>
                                
                                <div class="price" style="font-size: 2rem; color: #2563eb; margin-bottom: 1rem;">
                                    ${Utils.formatCurrency(
                                      hotel.pricePerNight
                                    )} 
                                    <span style="font-size: 1rem; color: #6b7280; font-weight: 400;">per night</span>
                                </div>
                                
                                <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem; color: #374151;">
                                    ${hotel.description}
                                </p>
                                
                                <!-- Booking section -->
                                <div class="card" style="background: #f8fafc; border: 2px solid #e2e8f0;">
                                    <div class="card-content">
                                        <h3 style="margin-bottom: 1rem;">Book Your Stay</h3>
                                        
                                        ${
                                          Auth.isLoggedIn()
                                            ? `
                                            <div class="grid grid-2" style="gap: 1rem; margin-bottom: 1rem;">
                                                <div class="form-group">
                                                    <label class="form-label">Check-in</label>
                                                    <input type="date" id="checkin" class="form-input" min="${
                                                      new Date()
                                                        .toISOString()
                                                        .split("T")[0]
                                                    }">
                                                </div>
                                                <div class="form-group">
                                                    <label class="form-label">Check-out</label>
                                                    <input type="date" id="checkout" class="form-input" min="${
                                                      new Date()
                                                        .toISOString()
                                                        .split("T")[0]
                                                    }">
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="form-label">Guests</label>
                                                <select id="guests" class="form-input">
                                                    <option value="1">1 Guest</option>
                                                    <option value="2">2 Guests</option>
                                                    <option value="3">3 Guests</option>
                                                    <option value="4">4 Guests</option>
                                                </select>
                                            </div>
                                            <button class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;" onclick="App.bookHotel(${
                                              hotel.id
                                            })">
                                                Book Now
                                            </button>
                                        `
                                            : `
                                            <p style="text-align: center; margin-bottom: 1rem;">Please login to book this hotel</p>
                                            <a href="#/login" class="btn btn-primary" style="width: 100%; text-align: center; padding: 1rem; font-size: 1.1rem;">
                                                Login to Book
                                            </a>
                                        `
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
      } catch (error) {
        Utils.showError("Failed to load hotel details. Please try again.");
      }
    },

    // Login page
    login() {
      if (Auth.isLoggedIn()) {
        Router.navigate("/");
        return;
      }

      const app = Utils.$("#app");
      app.innerHTML = `
                <div class="container">
                    <div style="max-width: 400px; margin: 0 auto;">
                        <h1 class="text-center mb-3">Login</h1>
                        
                        <form id="login-form">
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="email" class="form-input" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="password" id="password" class="form-input" required>
                            </div>
                            
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
                        </form>
                        
                        <p class="text-center mt-2">
                            Don't have an account? <a href="#/register">Register here</a>
                        </p>
                    </div>
                </div>
            `;

      // Handle form submission
      Utils.$("#login-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = Utils.$("#email").value;
        const password = Utils.$("#password").value;

        try {
          await Auth.login(email, password);
          Router.navigate("/");
        } catch (error) {
          // Error is already shown by Auth.login
        }
      });
    },

    // Register page
    register() {
      if (Auth.isLoggedIn()) {
        Router.navigate("/");
        return;
      }

      const app = Utils.$("#app");
      app.innerHTML = `
                <div class="container">
                    <div style="max-width: 400px; margin: 0 auto;">
                        <h1 class="text-center mb-3">Register</h1>
                        
                        <form id="register-form">
                            <div class="form-group">
                                <label class="form-label">Name</label>
                                <input type="text" id="name" class="form-input" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" id="email" class="form-input" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input type="password" id="password" class="form-input" required>
                            </div>
                            
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Register</button>
                        </form>
                        
                        <p class="text-center mt-2">
                            Already have an account? <a href="#/login">Login here</a>
                        </p>
                    </div>
                </div>
            `;

      // Handle form submission
      Utils.$("#register-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = Utils.$("#name").value;
        const email = Utils.$("#email").value;
        const password = Utils.$("#password").value;

        try {
          await Auth.register(name, email, password);
          Router.navigate("/");
        } catch (error) {
          // Error is already shown by Auth.register
        }
      });
    },

    // Profile page
    profile() {
      if (!Auth.isLoggedIn()) {
        Router.navigate("/login");
        return;
      }

      const user = Auth.getCurrentUser();
      const app = Utils.$("#app");
      app.innerHTML = `
                <div class="container">
                    <div style="max-width: 600px; margin: 0 auto;">
                        <h1>Profile</h1>
                        
                        <div class="card">
                            <div class="card-content">
                                <h3>User Information</h3>
                                <p><strong>Name:</strong> ${user.name}</p>
                                <p><strong>Email:</strong> ${user.email}</p>
                                <p><strong>Role:</strong> ${user.role}</p>
                                
                                <button class="btn btn-outline" onclick="Auth.logout()">Logout</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    },

    // Bookings page
    async bookings() {
      if (!Auth.isLoggedIn()) {
        Router.navigate("/login");
        return;
      }

      Utils.showLoading();

      try {
        const bookings = await API.bookings.getAll();

        const app = Utils.$("#app");
        app.innerHTML = `
                    <div class="container">
                        <h1>My Bookings</h1>
                        
                        ${
                          bookings.length === 0
                            ? `
                            <div class="text-center">
                                <p>You haven't made any bookings yet.</p>
                                <a href="#/hotels" class="btn btn-primary">Browse Hotels</a>
                            </div>
                        `
                            : `
                            <div class="grid grid-2">
                                ${bookings
                                  .map(
                                    (booking) => `
                                    <div class="card">
                                        <div class="card-content">
                                            <h3>${booking.hotelName}</h3>
                                            <p><strong>Check-in:</strong> ${Utils.formatDate(
                                              booking.checkInDate
                                            )}</p>
                                            <p><strong>Check-out:</strong> ${Utils.formatDate(
                                              booking.checkOutDate
                                            )}</p>
                                            <p><strong>Guests:</strong> ${
                                              booking.guests
                                            }</p>
                                            <p><strong>Total:</strong> ${Utils.formatCurrency(
                                              booking.totalAmount
                                            )}</p>
                                            <p><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">${
                                              booking.status
                                            }</span></p>
                                        </div>
                                    </div>
                                `
                                  )
                                  .join("")}
                            </div>
                        `
                        }
                    </div>
                `;
      } catch (error) {
        Utils.showError("Failed to load bookings. Please try again.");
      }
    },
  },

  // Book hotel function
  async bookHotel(hotelId) {
    if (!Auth.isLoggedIn()) {
      Router.navigate("/login");
      return;
    }

    // Get form data
    const checkIn = Utils.$("#checkin")?.value;
    const checkOut = Utils.$("#checkout")?.value;
    const guests = Utils.$("#guests")?.value || 1;

    // Validate dates
    if (!checkIn || !checkOut) {
      Utils.showToast("Please select check-in and check-out dates", "error");
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      Utils.showToast("Check-out date must be after check-in date", "error");
      return;
    }

    try {
      const booking = {
        hotelId: hotelId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests: parseInt(guests),
      };

      await API.bookings.create(booking);
      Utils.showToast("Booking created successfully!", "success");
      Router.navigate("/bookings");
    } catch (error) {
      Utils.showToast(error.message, "error");
    }
  },
};

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
