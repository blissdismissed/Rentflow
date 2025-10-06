// Property Management Dashboard JavaScript

// Authentication Management
class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.updateAuthUI();
    }

    isAuthenticated() {
        return !!this.token;
    }

    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        if (!authButtons) return;

        if (this.isAuthenticated()) {
            // Show user info and sign out button
            authButtons.innerHTML = `
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">Welcome, ${this.user?.name || 'User'}</span>
                    <button onclick="authManager.signOut()" class="bg-white text-teal-600 px-4 py-2 rounded-lg text-sm font-medium border border-teal-600 hover:bg-teal-50 transition-colors">
                        Sign Out
                    </button>
                </div>
            `;
        } else {
            // Show login and signup buttons
            authButtons.innerHTML = `
                <a href="login.html" class="bg-white text-teal-600 px-4 py-2 rounded-lg text-sm font-medium border border-teal-600 hover:bg-teal-50 transition-colors">
                    Login
                </a>
                <a href="signup.html" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
                    Sign Up
                </a>
            `;
        }
    }

    signOut() {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect to index page
        window.location.href = 'index.html';
    }
}

class PropertyManager {
    constructor() {
        this.properties = [
            {
                id: 1,
                name: "Ocean View Condo",
                type: "Condo",
                location: "Miami Beach, FL",
                revenue: 2450,
                occupancy: 85,
                status: "active",
                image: "https://kimi-web-img.moonshot.cn/img/cloudfront.wheretostay.com/6179acbd53f13a245e5287588731c26664aee442.jpg",
                rating: 4.8
            },
            {
                id: 2,
                name: "Mountain Retreat",
                type: "House",
                location: "Aspen, CO",
                revenue: 1890,
                occupancy: 78,
                status: "active",
                image: "https://kimi-web-img.moonshot.cn/img/media.architecturaldigest.com/eac92e54ff2d044f2e54400096b4a7d9660a1582.jpg",
                rating: 4.9
            },
            {
                id: 3,
                name: "Downtown Loft",
                type: "Apartment",
                location: "New York, NY",
                revenue: 1650,
                occupancy: 92,
                status: "pending",
                image: "https://kimi-web-img.moonshot.cn/img/decormatters-blog-uploads.s3.amazonaws.com/33307f1eed669ad9e7b203f71c0bce0c26f0a5f9.jpg",
                rating: 4.6
            },
            {
                id: 4,
                name: "Beachfront Villa",
                type: "House",
                location: "Malibu, CA",
                revenue: 3200,
                occupancy: 95,
                status: "active",
                image: "https://kimi-web-img.moonshot.cn/img/www.theluxurybali.com/6e01e4ed8fe6f1815a4f38cc2239cb81206f1675.jpg",
                rating: 4.9
            },
            {
                id: 5,
                name: "Urban Studio",
                type: "Apartment",
                location: "Seattle, WA",
                revenue: 1200,
                occupancy: 88,
                status: "active",
                image: "https://kimi-web-img.moonshot.cn/img/s3.envato.com/33e72913e2f18f99076c48f90d292a67d059cc85.jpg",
                rating: 4.4
            },
            {
                id: 6,
                name: "Lake House",
                type: "House",
                location: "Lake Tahoe, NV",
                revenue: 2100,
                occupancy: 82,
                status: "active",
                image: "https://kimi-web-img.moonshot.cn/img/archello.s3.eu-central-1.amazonaws.com/a06c0cd49802928a22563f7fdde60b3f1546d177.jpg",
                rating: 4.7
            }
        ];

        this.bookings = [
            {
                id: 1,
                propertyId: 1,
                guestName: "Sarah Johnson",
                checkIn: "2024-12-15",
                checkOut: "2024-12-20",
                channel: "Airbnb",
                amount: 1225,
                status: "confirmed"
            },
            {
                id: 2,
                propertyId: 2,
                guestName: "Mike Chen",
                checkIn: "2024-12-18",
                checkOut: "2024-12-25",
                channel: "VRBO",
                amount: 1890,
                status: "confirmed"
            },
            {
                id: 3,
                propertyId: 3,
                guestName: "Emma Wilson",
                checkIn: "2024-12-22",
                checkOut: "2024-12-28",
                channel: "Booking.com",
                amount: 1650,
                status: "pending"
            }
        ];

        this.financialData = {
            monthlyRevenue: [4500, 5200, 4800, 6100, 5800, 7200, 6900, 7500, 8200, 7800, 8500, 9200],
            monthlyExpenses: [2200, 2400, 2300, 2800, 2600, 3200, 3000, 3400, 3600, 3300, 3800, 4100],
            categories: ["Maintenance", "Cleaning", "Utilities", "Marketing", "Insurance", "Taxes"]
        };

        this.init();
    }

    init() {
        this.initializeAnimations();
        this.initializeCharts();
        this.updateMetrics();
        this.bindEvents();
        this.initializeParticles();
    }

    initializeAnimations() {
        // Typed.js for hero name
        if (document.getElementById('typed-name')) {
            new Typed('#typed-name', {
                strings: ['Sarah', 'Property Manager', 'Host'],
                typeSpeed: 100,
                backSpeed: 50,
                backDelay: 2000,
                loop: true
            });
        }

        // Animate metric cards on load
        anime({
            targets: '.metric-card',
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutExpo'
        });

        // Animate activity items
        anime({
            targets: '.activity-item',
            translateX: [-30, 0],
            opacity: [0, 1],
            delay: anime.stagger(150, {start: 500}),
            duration: 600,
            easing: 'easeOutQuart'
        });
    }

    initializeCharts() {
        this.createRevenueChart();
    }

    createRevenueChart() {
        const chartElement = document.getElementById('revenue-chart');
        if (!chartElement) return;

        const chart = echarts.init(chartElement);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e5e7eb',
                textStyle: {
                    color: '#374151'
                }
            },
            legend: {
                data: ['Revenue', 'Expenses'],
                bottom: 0,
                textStyle: {
                    color: '#6b7280'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: months,
                axisLine: {
                    lineStyle: {
                        color: '#e5e7eb'
                    }
                },
                axisLabel: {
                    color: '#6b7280'
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: '#e5e7eb'
                    }
                },
                axisLabel: {
                    color: '#6b7280',
                    formatter: '${value}'
                },
                splitLine: {
                    lineStyle: {
                        color: '#f3f4f6'
                    }
                }
            },
            series: [
                {
                    name: 'Revenue',
                    type: 'line',
                    data: this.financialData.monthlyRevenue,
                    smooth: true,
                    lineStyle: {
                        color: '#0f766e',
                        width: 3
                    },
                    itemStyle: {
                        color: '#0f766e'
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [{
                                offset: 0, color: 'rgba(15, 118, 110, 0.3)'
                            }, {
                                offset: 1, color: 'rgba(15, 118, 110, 0.05)'
                            }]
                        }
                    }
                },
                {
                    name: 'Expenses',
                    type: 'line',
                    data: this.financialData.monthlyExpenses,
                    smooth: true,
                    lineStyle: {
                        color: '#f59e0b',
                        width: 3
                    },
                    itemStyle: {
                        color: '#f59e0b'
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [{
                                offset: 0, color: 'rgba(245, 158, 11, 0.2)'
                            }, {
                                offset: 1, color: 'rgba(245, 158, 11, 0.05)'
                            }]
                        }
                    }
                }
            ]
        };

        chart.setOption(option);

        // Animate chart on load
        setTimeout(() => {
            chart.setOption(option, true);
        }, 500);

        // Make chart responsive
        window.addEventListener('resize', () => {
            chart.resize();
        });
    }

    updateMetrics() {
        // Calculate metrics
        const totalRevenue = this.properties.reduce((sum, prop) => sum + prop.revenue, 0);
        const avgOccupancy = this.properties.reduce((sum, prop) => sum + prop.occupancy, 0) / this.properties.length;
        const activeProperties = this.properties.filter(prop => prop.status === 'active').length;
        const avgRating = this.properties.reduce((sum, prop) => sum + prop.rating, 0) / this.properties.length;

        // Animate counters
        this.animateCounter('monthly-revenue', totalRevenue, '$');
        this.animateCounter('occupancy-rate', Math.round(avgOccupancy), '', '%');
        this.animateCounter('active-properties', activeProperties);
        this.animateCounter('guest-rating', avgRating.toFixed(1));
    }

    animateCounter(elementId, targetValue, prefix = '', suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const duration = 2000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
            
            if (elementId === 'guest-rating') {
                element.textContent = prefix + currentValue.toFixed(1) + suffix;
            } else if (elementId === 'monthly-revenue') {
                element.textContent = prefix + Math.round(currentValue).toLocaleString();
            } else {
                element.textContent = prefix + Math.round(currentValue) + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    initializeParticles() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const particleContainer = document.getElementById('particles');
        
        if (!particleContainer) return;

        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        
        particleContainer.appendChild(canvas);

        const resizeCanvas = () => {
            canvas.width = particleContainer.offsetWidth;
            canvas.height = particleContainer.offsetHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const particles = [];
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(15, 118, 110, ${particle.opacity})`;
                ctx.fill();
            });
            
            requestAnimationFrame(animate);
        };

        animate();
    }

    bindEvents() {
        // Quick action buttons
        document.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('.quick-action').dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                if (e.target.getAttribute('href') !== 'index.html') {
                    e.preventDefault();
                    this.showComingSoon();
                }
            });
        });

        // Property cards hover effects
        document.querySelectorAll('.property-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                anime({
                    targets: card,
                    scale: 1.02,
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });

            card.addEventListener('mouseleave', () => {
                anime({
                    targets: card,
                    scale: 1,
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'calendar':
                window.location.href = 'calendar.html';
                break;
            case 'report':
                this.showComingSoon();
                break;
            case 'message':
                this.showComingSoon();
                break;
            default:
                this.showComingSoon();
        }
    }

    showComingSoon() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-xl p-8 max-w-md mx-4 text-center';
        modal.innerHTML = `
            <div class="mb-6">
                <div class="h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="h-8 w-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Coming Soon!</h3>
                <p class="text-gray-600">This feature is currently under development and will be available soon.</p>
            </div>
            <button class="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors" onclick="this.closest('.fixed').remove()">
                Got it
            </button>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Animate modal in
        anime({
            targets: modal,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutBack'
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }
}

// Calendar Management System
class CalendarManager {
    constructor() {
        this.selectedDate = new Date();
        this.bookings = [];
        this.channels = ['Airbnb', 'VRBO', 'Booking.com', 'Direct'];
        this.init();
    }

    init() {
        this.generateSampleBookings();
        if (document.getElementById('calendar-grid')) {
            this.renderCalendar();
        }
    }

    generateSampleBookings() {
        const today = new Date();
        const bookings = [];

        // Generate sample bookings for the next 3 months
        for (let i = 0; i < 15; i++) {
            const checkIn = new Date(today);
            checkIn.setDate(today.getDate() + Math.random() * 90);
            
            const checkOut = new Date(checkIn);
            checkOut.setDate(checkIn.getDate() + Math.floor(Math.random() * 7) + 2);

            bookings.push({
                id: i + 1,
                propertyId: Math.floor(Math.random() * 6) + 1,
                guestName: `Guest ${i + 1}`,
                checkIn: checkIn.toISOString().split('T')[0],
                checkOut: checkOut.toISOString().split('T')[0],
                channel: this.channels[Math.floor(Math.random() * this.channels.length)],
                status: Math.random() > 0.2 ? 'confirmed' : 'pending'
            });
        }

        this.bookings = bookings;
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;

        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        let calendarHTML = '<div class="calendar-grid grid grid-cols-7 gap-1">';
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="calendar-header text-center font-medium text-gray-600 py-2">${day}</div>`;
        });

        // Empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = date.toISOString().split('T')[0];
            const dayBookings = this.bookings.filter(booking => 
                dateString >= booking.checkIn && dateString < booking.checkOut
            );

            let dayClass = 'calendar-day relative min-h-24 p-2 border border-gray-200 hover:bg-gray-50 cursor-pointer';
            let bookingIndicators = '';

            if (dayBookings.length > 0) {
                dayClass += ' has-bookings';
                bookingIndicators = '<div class="booking-indicators flex flex-wrap gap-1 mt-1">';
                dayBookings.slice(0, 3).forEach(booking => {
                    const channelColor = this.getChannelColor(booking.channel);
                    bookingIndicators += `<div class="w-2 h-2 rounded-full ${channelColor}" title="${booking.guestName} - ${booking.channel}"></div>`;
                });
                if (dayBookings.length > 3) {
                    bookingIndicators += `<div class="text-xs text-gray-500">+${dayBookings.length - 3}</div>`;
                }
                bookingIndicators += '</div>';
            }

            calendarHTML += `
                <div class="${dayClass}" data-date="${dateString}">
                    <div class="font-medium text-gray-900">${day}</div>
                    ${bookingIndicators}
                </div>
            `;
        }

        calendarHTML += '</div>';
        calendarGrid.innerHTML = calendarHTML;

        // Add click events to calendar days
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.currentTarget.dataset.date;
                if (date) {
                    this.showDayDetails(date);
                }
            });
        });
    }

    getChannelColor(channel) {
        const colors = {
            'Airbnb': 'bg-red-500',
            'VRBO': 'bg-blue-500',
            'Booking.com': 'bg-green-500',
            'Direct': 'bg-purple-500'
        };
        return colors[channel] || 'bg-gray-500';
    }

    showDayDetails(date) {
        const dayBookings = this.bookings.filter(booking => 
            date >= booking.checkIn && date < booking.checkOut
        );

        if (dayBookings.length === 0) {
            this.showBookingModal(date);
        } else {
            this.showDayBookingsModal(date, dayBookings);
        }
    }

    showBookingModal(date) {
        const modal = this.createModal('Create Booking', `
            <form id="booking-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Property</label>
                    <select name="property" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        ${this.properties.map(prop => `<option value="${prop.id}">${prop.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                    <input type="text" name="guestName" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                        <input type="date" name="checkIn" value="${date}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                        <input type="date" name="checkOut" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                    <select name="channel" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                        ${this.channels.map(channel => `<option value="${channel}">${channel}</option>`).join('')}
                    </select>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" class="px-4 py-2 text-gray-600 hover:text-gray-800" onclick="this.closest('.fixed').remove()">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Create Booking</button>
                </div>
            </form>
        `);

        document.getElementById('booking-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createBooking(new FormData(e.target));
            modal.remove();
        });
    }

    createBooking(formData) {
        const newBooking = {
            id: this.bookings.length + 1,
            propertyId: parseInt(formData.get('property')),
            guestName: formData.get('guestName'),
            checkIn: formData.get('checkIn'),
            checkOut: formData.get('checkOut'),
            channel: formData.get('channel'),
            status: 'confirmed'
        };

        this.bookings.push(newBooking);
        this.renderCalendar();
        this.showNotification('Booking created successfully!', 'success');
    }

    createModal(title, content) {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-xl p-6 max-w-md mx-4 w-full max-h-96 overflow-y-auto';
        modal.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                <button class="text-gray-400 hover:text-gray-600" onclick="this.closest('.fixed').remove()">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            ${content}
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Animate modal in
        anime({
            targets: modal,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutBack'
        });

        return overlay;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-100 text-green-800' : 
            type === 'error' ? 'bg-red-100 text-red-800' : 
            'bg-blue-100 text-blue-800'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        anime({
            targets: notification,
            translateX: [300, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });

        // Remove after 3 seconds
        setTimeout(() => {
            anime({
                targets: notification,
                translateX: [0, 300],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeInQuart',
                complete: () => notification.remove()
            });
        }, 3000);
    }
}

// Property Management System
class PropertyManagerUI {
    constructor() {
        this.properties = [];
        this.init();
    }

    init() {
        if (document.getElementById('properties-grid')) {
            this.loadProperties();
            this.renderProperties();
            this.bindPropertyEvents();
        }
    }

    loadProperties() {
        // Load properties from main PropertyManager
        if (window.propertyManager) {
            this.properties = window.propertyManager.properties;
        }
    }

    renderProperties() {
        const grid = document.getElementById('properties-grid');
        if (!grid) return;

        grid.innerHTML = this.properties.map(property => `
            <div class="property-card bg-white rounded-xl shadow-sm overflow-hidden card-hover" data-property-id="${property.id}">
                <div class="relative">
                    <img class="w-full h-48 object-cover" src="${property.image}" alt="${property.name}">
                    <div class="absolute top-4 right-4">
                        <span class="status-badge ${property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} px-2 py-1 rounded-full text-xs font-medium">
                            ${property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                        </span>
                    </div>
                </div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-lg font-semibold text-gray-900">${property.name}</h3>
                        <div class="flex items-center">
                            <svg class="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                            </svg>
                            <span class="text-sm text-gray-600">${property.rating}</span>
                        </div>
                    </div>
                    <p class="text-gray-600 text-sm mb-4">${property.location}</p>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p class="text-xs text-gray-500 uppercase tracking-wide">Revenue</p>
                            <p class="text-lg font-semibold text-gray-900">$${property.revenue.toLocaleString()}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 uppercase tracking-wide">Occupancy</p>
                            <p class="text-lg font-semibold text-gray-900">${property.occupancy}%</p>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <button class="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors" onclick="propertyUI.editProperty(${property.id})">
                            Manage
                        </button>
                        <button class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" onclick="propertyUI.viewCalendar(${property.id})">
                            Calendar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    bindPropertyEvents() {
        // Filter functionality
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterProperties(filter);
                
                // Update active state
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Search functionality
        const searchInput = document.getElementById('property-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProperties(e.target.value);
            });
        }
    }

    filterProperties(filter) {
        const cards = document.querySelectorAll('.property-card');
        
        cards.forEach(card => {
            const propertyId = parseInt(card.dataset.propertyId);
            const property = this.properties.find(p => p.id === propertyId);
            
            let show = true;
            if (filter !== 'all') {
                show = property.status === filter || property.type.toLowerCase() === filter;
            }
            
            if (show) {
                card.style.display = 'block';
                anime({
                    targets: card,
                    opacity: [0, 1],
                    translateY: [20, 0],
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            } else {
                anime({
                    targets: card,
                    opacity: [1, 0],
                    translateY: [0, -20],
                    duration: 200,
                    easing: 'easeInQuart',
                    complete: () => {
                        card.style.display = 'none';
                    }
                });
            }
        });
    }

    searchProperties(query) {
        const cards = document.querySelectorAll('.property-card');
        const searchTerm = query.toLowerCase();
        
        cards.forEach(card => {
            const propertyId = parseInt(card.dataset.propertyId);
            const property = this.properties.find(p => p.id === propertyId);
            
            const matches = property.name.toLowerCase().includes(searchTerm) ||
                          property.location.toLowerCase().includes(searchTerm) ||
                          property.type.toLowerCase().includes(searchTerm);
            
            if (matches || !query) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    editProperty(propertyId) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property) return;

        const modal = propertyManager.createModal('Edit Property', `
            <form id="property-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                        <input type="text" name="name" value="${property.name}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select name="type" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="House" ${property.type === 'House' ? 'selected' : ''}>House</option>
                            <option value="Condo" ${property.type === 'Condo' ? 'selected' : ''}>Condo</option>
                            <option value="Apartment" ${property.type === 'Apartment' ? 'selected' : ''}>Apartment</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" name="location" value="${property.location}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue</label>
                        <input type="number" name="revenue" value="${property.revenue}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Occupancy Rate (%)</label>
                        <input type="number" name="occupancy" value="${property.occupancy}" class="w-full border border-gray-300 rounded-lg px-3 py-2" required>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" class="px-4 py-2 text-gray-600 hover:text-gray-800" onclick="this.closest('.fixed').remove()">Cancel</button>
                    <button type="submit" class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save Changes</button>
                </div>
            </form>
        `);

        document.getElementById('property-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProperty(propertyId, new FormData(e.target));
            modal.remove();
        });
    }

    updateProperty(propertyId, formData) {
        const propertyIndex = this.properties.findIndex(p => p.id === propertyId);
        if (propertyIndex === -1) return;

        this.properties[propertyIndex] = {
            ...this.properties[propertyIndex],
            name: formData.get('name'),
            type: formData.get('type'),
            location: formData.get('location'),
            revenue: parseInt(formData.get('revenue')),
            occupancy: parseInt(formData.get('occupancy'))
        };

        this.renderProperties();
        propertyManager.showNotification('Property updated successfully!', 'success');
    }

    viewCalendar(propertyId) {
        window.location.href = `calendar.html?property=${propertyId}`;
    }
}

// Financial Manager Class
class FinancialManager {
    constructor() {
        this.expenses = [
            { id: 1, date: '2024-12-01', description: 'Deep cleaning - Ocean View Condo', amount: 150, category: 'Cleaning', property: 'Ocean View Condo', taxDeductible: true },
            { id: 2, date: '2024-12-02', description: 'HVAC repair - Mountain Retreat', amount: 320, category: 'Maintenance', property: 'Mountain Retreat', taxDeductible: true },
            { id: 3, date: '2024-12-03', description: 'Electricity bill - Downtown Loft', amount: 85, category: 'Utilities', property: 'Downtown Loft', taxDeductible: true },
            { id: 4, date: '2024-12-04', description: 'Professional photography - Beachfront Villa', amount: 200, category: 'Marketing', property: 'Beachfront Villa', taxDeductible: true },
            { id: 5, date: '2024-12-05', description: 'Property insurance - All properties', amount: 450, category: 'Insurance', property: 'Portfolio', taxDeductible: true },
            { id: 6, date: '2024-12-06', description: 'Window cleaning - Urban Studio', amount: 75, category: 'Cleaning', property: 'Urban Studio', taxDeductible: true },
            { id: 7, date: '2024-12-07', description: 'Plumbing fix - Lake House', amount: 180, category: 'Maintenance', property: 'Lake House', taxDeductible: true },
            { id: 8, date: '2024-12-08', description: 'Internet bill - All properties', amount: 120, category: 'Utilities', property: 'Portfolio', taxDeductible: true }
        ];

        this.revenue = 12500;
        this.totalExpenses = 4200;

        this.init();
    }

    init() {
        this.updateFinancialMetrics();
        this.renderExpenses();
        this.initializeCharts();
        this.bindUploadEvents();
        this.updateMonthlyStats();
    }

    updateFinancialMetrics() {
        const netProfit = this.revenue - this.totalExpenses;
        const profitMargin = (netProfit / this.revenue) * 100;

        // Animate counters
        this.animateCounter('total-revenue', this.revenue, '$');
        this.animateCounter('total-expenses', this.totalExpenses, '$');
        this.animateCounter('net-profit', netProfit, '$');
        this.animateCounter('profit-margin', profitMargin.toFixed(1), '', '%');
    }

    renderExpenses() {
        const expensesList = document.getElementById('expenses-list');
        if (!expensesList) return;

        expensesList.innerHTML = this.expenses.map(expense => `
            <div class="expense-item p-4 rounded-lg">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-medium text-gray-900">${expense.description}</h4>
                            <span class="font-semibold text-gray-900">$${expense.amount}</span>
                        </div>
                        <div class="flex items-center space-x-4 text-sm text-gray-600">
                            <span>${new Date(expense.date).toLocaleDateString()}</span>
                            <span class="category-badge category-${expense.category.toLowerCase()}">${expense.category}</span>
                            <span>${expense.property}</span>
                            ${expense.taxDeductible ? '<span class="text-green-600">Tax Deductible</span>' : ''}
                        </div>
                    </div>
                    <button class="ml-4 text-gray-400 hover:text-gray-600" onclick="financialManager.editExpense(${expense.id})">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }

    initializeCharts() {
        this.createRevenueExpensesChart();
        this.createExpenseBreakdownChart();
    }

    createRevenueExpensesChart() {
        const chartElement = document.getElementById('revenue-expenses-chart');
        if (!chartElement) return;

        if (typeof echarts === 'undefined') return;
        const chart = echarts.init(chartElement);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revenueData = [8200, 9100, 8800, 10200, 9800, 11500, 11200, 10800, 12500, 12100, 11800, 12500];
        const expensesData = [3200, 3800, 3500, 4200, 3900, 4600, 4300, 4100, 4200, 4000, 3900, 4200];

        const option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e5e7eb',
                textStyle: { color: '#374151' }
            },
            legend: {
                data: ['Revenue', 'Expenses'],
                bottom: 0,
                textStyle: { color: '#6b7280' }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: months,
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280' }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#e5e7eb' } },
                axisLabel: { color: '#6b7280', formatter: '${value}' },
                splitLine: { lineStyle: { color: '#f3f4f6' } }
            },
            series: [
                {
                    name: 'Revenue',
                    type: 'bar',
                    data: revenueData,
                    itemStyle: { color: '#10b981' },
                    barWidth: '40%'
                },
                {
                    name: 'Expenses',
                    type: 'bar',
                    data: expensesData,
                    itemStyle: { color: '#f59e0b' },
                    barWidth: '40%'
                }
            ]
        };

        chart.setOption(option);

        // Make chart responsive
        window.addEventListener('resize', () => chart.resize());
    }

    createExpenseBreakdownChart() {
        const chartElement = document.getElementById('expense-breakdown-chart');
        if (!chartElement) return;

        if (typeof echarts === 'undefined') return;
        const chart = echarts.init(chartElement);

        const expenseCategories = [
            { name: 'Maintenance', value: 1200, itemStyle: { color: '#f59e0b' } },
            { name: 'Cleaning', value: 800, itemStyle: { color: '#3b82f6' } },
            { name: 'Utilities', value: 600, itemStyle: { color: '#10b981' } },
            { name: 'Marketing', value: 400, itemStyle: { color: '#ec4899' } },
            { name: 'Insurance', value: 800, itemStyle: { color: '#6366f1' } },
            { name: 'Taxes', value: 400, itemStyle: { color: '#ef4444' } }
        ];

        const option = {
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: ${c} ({d}%)',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e5e7eb',
                textStyle: { color: '#374151' }
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                textStyle: { color: '#6b7280' }
            },
            series: [
                {
                    name: 'Expenses',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['60%', '50%'],
                    avoidLabelOverlap: false,
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: '18',
                            fontWeight: 'bold'
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data: expenseCategories
                }
            ]
        };

        chart.setOption(option);

        // Make chart responsive
        window.addEventListener('resize', () => chart.resize());
    }

    bindUploadEvents() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('receipt-upload');

        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleFileUpload(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });
    }

    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
                this.processReceipt(file);
            }
        });
    }

    processReceipt(file) {
        // Simulate OCR processing
        const mockExpense = {
            id: this.expenses.length + 1,
            date: new Date().toISOString().split('T')[0],
            description: `Receipt from ${file.name}`,
            amount: Math.floor(Math.random() * 200) + 50,
            category: 'Maintenance',
            property: 'Various Properties',
            taxDeductible: true
        };

        // Add to expenses list
        this.expenses.unshift(mockExpense);
        this.renderExpenses();
        this.updateFinancialMetrics();

        // Show notification
        this.showNotification(`Receipt processed: ${mockExpense.description} - $${mockExpense.amount}`, 'success');
    }

    updateMonthlyStats() {
        // Mock monthly statistics
        const monthRevenue = 12500;
        const monthExpenses = 4200;
        const monthBookings = 18;
        const avgStay = 4.2;
        const taxDeductible = 3800;
        const taxOwed = 2100;

        this.animateCounter('month-revenue', monthRevenue, '$');
        this.animateCounter('month-expenses', monthExpenses, '$');
        this.animateCounter('month-bookings', monthBookings);
        this.animateCounter('avg-stay', avgStay.toFixed(1), '', ' nights');
        this.animateCounter('tax-deductible', taxDeductible, '$');
        this.animateCounter('tax-owed', taxOwed, '$');
    }

    animateCounter(elementId, targetValue, prefix = '', suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (targetValue - startValue) * easeOutQuart;

            if (elementId === 'avg-stay' || elementId === 'profit-margin') {
                element.textContent = prefix + currentValue.toFixed(1) + suffix;
            } else if (elementId === 'total-revenue' || elementId === 'total-expenses' || elementId === 'net-profit' || elementId === 'month-revenue' || elementId === 'month-expenses' || elementId === 'tax-deductible' || elementId === 'tax-owed') {
                element.textContent = prefix + Math.round(currentValue).toLocaleString();
            } else {
                element.textContent = prefix + Math.round(currentValue) + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'success' ? 'bg-green-100 text-green-800' :
            type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        if (typeof anime !== 'undefined') {
            anime({
                targets: notification,
                translateX: [300, 0],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuart'
            });

            // Remove after 3 seconds
            setTimeout(() => {
                anime({
                    targets: notification,
                    translateX: [0, 300],
                    opacity: [1, 0],
                    duration: 300,
                    easing: 'easeInQuart',
                    complete: () => notification.remove()
                });
            }, 3000);
        } else {
            // Fallback if anime.js is not available
            setTimeout(() => notification.remove(), 3000);
        }
    }

    editExpense(expenseId) {
        // Mock edit functionality
        this.showNotification('Edit functionality coming soon!', 'info');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth manager first
    window.authManager = new AuthManager();

    // Initialize main property manager
    window.propertyManager = new PropertyManager();
    
    // Initialize calendar manager if on calendar page
    if (document.getElementById('calendar-grid')) {
        window.calendarManager = new CalendarManager();
    }
    
    // Initialize property UI if on properties page
    if (document.getElementById('properties-grid')) {
        window.propertyUI = new PropertyManagerUI();
    }

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            if (!this.classList.contains('no-loading')) {
                this.style.opacity = '0.7';
                setTimeout(() => {
                    this.style.opacity = '1';
                }, 300);
            }
        });
    });
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PropertyManager,
        CalendarManager,
        PropertyManagerUI,
        FinancialManager
    };
}