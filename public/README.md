# AspireTowards - Direct Booking Website

**Mountain Escapes and Family-Friendly Vacation Rentals**

This is the guest-facing booking website for AspireTowards vacation rentals.

---

## 📁 Site Structure

```
/public/
├── index.html           → Landing page (homepage)
├── properties.html      → Browse all properties
├── property.html        → Individual property details
├── booking.html         → Checkout & payment
├── confirmation.html    → Booking success
└── README.md           → This file
```

---

## 🌐 Pages

### 1. Landing Page (`index.html`)
**Purpose**: Marketing homepage to attract guests

**Sections**:
- Hero with call-to-action
- Featured properties (auto-loads from API)
- "Why Book Direct" benefits
- How it works (4 steps)
- Guest testimonials
- Contact footer

**URL**: `http://localhost:8000/public/index.html`

---

### 2. Properties Listing (`properties.html`)
**Purpose**: Browse all available properties

**Features**:
- Grid view of properties
- Filters (price, bedrooms, guests, location)
- Sort options (price, bedrooms)
- Property cards with images & pricing
- Real-time API loading

**URL**: `http://localhost:8000/public/properties.html`

---

### 3. Property Detail (`property.html`)
**Purpose**: Showcase individual property with booking

**Features**:
- Photo gallery (main + grid)
- Property details (beds, baths, guests)
- Full description
- Amenities list
- House rules
- Cancellation policy
- **Booking widget**:
  - Date picker (blocks booked dates)
  - Guest selection
  - Live price calculation
  - Deposit breakdown (10% / 90%)

**URL**: `http://localhost:8000/public/property.html?slug=PROPERTY_SLUG`

**Example**: `http://localhost:8000/public/property.html?slug=bromley-mountain-escape-2-balconies`

---

### 4. Booking Page (`booking.html`)
**Purpose**: Complete booking request & payment

**Features**:
- Trip summary (dates, guests, property)
- Guest information form
- **Stripe card payment** (authorization only - not charged until approval)
- Price breakdown with deposit/balance
- Terms & conditions
- Secure checkout

**URL**: `http://localhost:8000/public/booking.html?slug=SLUG&checkIn=DATE&checkOut=DATE&guests=NUM`

---

### 5. Confirmation (`confirmation.html`)
**Purpose**: Success screen after booking

**Features**:
- Animated success checkmark
- Confirmation code
- Booking details
- Payment breakdown
- "What happens next" timeline
- Important information

**URL**: `http://localhost:8000/public/confirmation.html?code=CONFIRMATION_CODE`

---

## 🎨 Branding

**Business Name**: AspireTowards
**Tagline**: "Mountain escapes and family-friendly vacation rentals"
**Email**: info@aspiretowards.com
**Phone**: (555) 123-4567

**Colors**:
- Primary: Teal (#0F766E)
- Accent: Teal light (#14B8A6)
- Text: Gray (#1F2937)

---

## 🔌 API Integration

All pages connect to the backend API at: `http://localhost:5000/api/public`

**Endpoints Used**:
- `GET /properties` - List all public properties
- `GET /properties/:slug` - Get property details
- `GET /properties/:slug/availability` - Check dates & pricing
- `POST /bookings/request` - Submit booking request
- `GET /bookings/:confirmationCode` - Get booking status

---

## 💳 Payment Flow

1. **Guest selects dates** → Price calculated with 10% deposit / 90% balance
2. **Guest enters info** → Name, email, phone, message
3. **Guest enters card** → Stripe Elements (secure)
4. **Submit request** → Card **authorized** (NOT charged)
5. **Host reviews** → Sees pending request in dashboard
6. **Host approves** → Deposit **captured** (charged)
7. **Guest arrives** → Pays 90% balance (cash/card/Venmo)

**Important**: Card is only authorized on submission. No charge until host approval!

---

## 📱 Responsive Design

All pages are fully responsive:
- Mobile: Single column layout
- Tablet: 2-column grids
- Desktop: Full 3-column layouts
- Built with Tailwind CSS

---

## 🔒 No Authentication Required

Guests can browse and book **without creating an account**:
- ✓ Browse properties (no login)
- ✓ View property details (no login)
- ✓ Submit booking request (no login)
- ✓ Check booking status (confirmation code only)

**Privacy-friendly**: We only collect info needed for the booking.

---

## 🛠️ Technical Stack

**Frontend**:
- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript (no framework)
- Flatpickr (date picker)
- Stripe.js (payments)

**Backend API**:
- Node.js + Express
- PostgreSQL database
- Stripe payments
- JWT authentication (host side)

---

## 🎯 Featured Property

**Bromley Mountain Escape w/ 2 Balconies: Hike & Ski**

Located in Peru, Vermont - perfect for families!

**Highlights**:
- 3 bedrooms, 2 bathrooms, sleeps 8
- 2 private balconies with mountain views
- Near Bromley Mountain (family ski resort)
- Appalachian Trail access
- Small town Vermont charm
- Pet-friendly (with approval)
- $175/night + $100 cleaning fee

**Marketing Focus**:
- Family-friendly skiing
- Hiking the Appalachian Trail
- Small-town experience
- 4-season activities
- Value & comfort

---

## 🚀 How to Run

### Development:
```bash
# From project root
python -m http.server 8000

# Or use any static file server
# Then visit: http://localhost:8000/public/index.html
```

### Production:
- Upload `/public/` directory to web host
- Point domain (aspiretowards.com) to this directory
- Update API_URL in each file to production backend

---

## 📝 Customization

### Add New Property:
1. Create property in database with `slug` field
2. Set `publiclyVisible = true` and `isActive = true`
3. Property appears automatically on properties page
4. Access at: `/property.html?slug=your-property-slug`

### Update Branding:
1. Find/replace "AspireTowards" in all files
2. Update logo/colors in inline styles
3. Change email: info@aspiretowards.com
4. Update phone: (555) 123-4567

### Modify Styling:
- All pages use Tailwind CSS classes
- Custom styles in `<style>` tags at top of each file
- Colors use teal (#0F766E) as primary

---

## 🎨 Design System

**Fonts**:
- Body: Inter (sans-serif)
- Headings: Playfair Display (serif)

**Components**:
- Cards: Rounded corners (16px), shadow, hover lift
- Buttons: Teal primary, white secondary
- Forms: Rounded inputs (8px), teal focus ring
- Status badges: Color-coded by platform/status

**Spacing**:
- Sections: py-16 (4rem)
- Cards: p-6 (1.5rem)
- Grids: gap-6 or gap-8

---

## 📧 Contact Information

Displayed on all pages:
- **Email**: info@aspiretowards.com
- **Phone**: (555) 123-4567
- **Support**: 24/7 available

Update these in footer of each file or make dynamic from settings.

---

## ✅ Features

✓ Property browsing with filters
✓ Live availability checking
✓ Dynamic pricing calculation
✓ Stripe payment integration
✓ Responsive mobile design
✓ SEO-friendly URLs (slugs)
✓ No login required for guests
✓ Email notifications (pending)
✓ Review-before-confirm workflow
✓ 10% deposit / 90% balance split
✓ Guest messaging to host

---

## 🔜 Future Enhancements

- [ ] Search functionality
- [ ] Property map view
- [ ] Guest reviews/ratings
- [ ] Photo lightbox gallery
- [ ] Social sharing
- [ ] Multi-currency support
- [ ] Email notifications
- [ ] SMS confirmations
- [ ] Calendar export (iCal)
- [ ] Promo codes

---

**Built with ❤️ for small vacation rental businesses**

Skip the Airbnb fees. Book direct. Support local.
