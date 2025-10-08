# Direct Booking System - Implementation Plan

## Overview
Build a public-facing booking website where guests can book properties directly, bypassing Airbnb/VRBO fees while maintaining a professional booking experience.

---

## 🎯 Project Goals

1. **Save 15-20% in platform fees** per booking
2. **Build direct customer relationships** (own the guest list)
3. **Professional booking experience** rivaling Airbnb
4. **Host review system** - approve bookings before confirmation
5. **Secure payment processing** - 10% deposit upfront, 90% on arrival

---

## 🏗️ Technical Architecture

### Site Structure
```
aspiretowards.com/
│
├── index.html                          # Public landing page
├── properties.html                      # Browse all properties (grid view)
├── property.html?slug=ocean-view      # Individual property details
├── booking.html?property=xxx           # Booking flow
├── confirmation.html                   # Booking confirmation
│
└── /rentflow/                          # Management Dashboard
    └── [existing dashboard pages]
```

### User Flows

#### **Guest Booking Flow:**
```
1. Land on aspiretowards.com
2. Click "View Properties" or browse /properties.html
3. Click property → property.html?slug=ocean-view-condo
4. View photos, amenities, pricing, calendar
5. Click "Request to Book"
6. Select dates, enter guest info
7. Review pricing: $1,000 total
   - Deposit (10%): $100 (pay now via Stripe)
   - Due at arrival: $900
8. Pay $100 deposit with card
9. Booking request submitted → "Pending Host Approval"
10. Host approves → Guest receives confirmation email
11. Guest arrives → pays $900 remaining balance
```

#### **Host Management Flow:**
```
1. Guest submits booking request
2. Host receives email notification
3. Host logs into /rentflow/bookings
4. Sees new "Pending" booking request
5. Reviews guest details, dates, message
6. Clicks "Approve" or "Decline"
   - Approve → Guest charged deposit, booking confirmed
   - Decline → Deposit refunded, guest notified
7. Booking appears on calendar
8. Guest arrives → collect $900 cash/card on-site
```

---

## 💳 Payment Strategy

### Stripe Integration - Two-Step Payment

**Step 1: Deposit (10%)**
- Guest submits booking request
- Stripe creates a **Payment Intent** (holds card)
- **Authorization only** - no charge yet
- If host declines → authorization released
- If host approves → charge captured

**Step 2: Balance (90%)**
- Paid on arrival (cash, card, Venmo, etc.)
- Manual payment recorded in dashboard
- Or: Send Stripe payment link before arrival

### Payment Flow Implementation
```javascript
// When guest submits booking:
1. Calculate 10% deposit
2. Create Stripe PaymentIntent with amount
3. Guest enters card info (Stripe Elements)
4. Card authorized (not charged)
5. Booking status = "pending_approval"

// When host approves:
1. Capture PaymentIntent
2. Charge guest's card
3. Send confirmation email
4. Update booking status = "confirmed"

// When host declines:
1. Cancel PaymentIntent
2. Release authorization
3. Send decline email
4. Update booking status = "declined"
```

---

## 📋 Database Schema Updates

### Properties Table - Add Public Fields
```sql
ALTER TABLE properties ADD COLUMN slug VARCHAR(255) UNIQUE;
ALTER TABLE properties ADD COLUMN featured_image TEXT;
ALTER TABLE properties ADD COLUMN house_rules TEXT;
ALTER TABLE properties ADD COLUMN cancellation_policy VARCHAR(50);
ALTER TABLE properties ADD COLUMN check_in_instructions TEXT;
ALTER TABLE properties ADD COLUMN instant_book BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN minimum_stay INTEGER DEFAULT 1;
ALTER TABLE properties ADD COLUMN maximum_stay INTEGER DEFAULT 365;
```

### Bookings Table - Add Payment Tracking
```sql
ALTER TABLE bookings ADD COLUMN deposit_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN deposit_paid BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN deposit_paid_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN balance_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN balance_paid BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN balance_paid_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN stripe_payment_intent_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN booking_status ENUM('requested', 'approved', 'declined', 'confirmed', 'completed', 'cancelled');
ALTER TABLE bookings ADD COLUMN host_message TEXT;
ALTER TABLE bookings ADD COLUMN guest_message TEXT;
```

---

## 🎨 Frontend Pages to Build

### 1. Public Landing Page (`index.html`)
**Purpose:** Marketing page for your vacation rentals

**Sections:**
- Hero: "Book Your Dream Vacation Directly"
- Featured properties (2 cards)
- Why book direct? (save money, better support)
- Testimonials
- CTA: "Browse Properties"

### 2. Properties Listing Page (`properties.html`)
**Purpose:** Browse all available properties

**Features:**
- Property cards with:
  - Main photo
  - Property name
  - Location (city, state)
  - Price per night
  - Rating (future)
  - "View Details" button
- Filters (future):
  - Price range
  - Bedrooms
  - Amenities
  - Dates available

### 3. Property Detail Page (`property.html?slug=ocean-view-condo`)
**Purpose:** Showcase individual property

**Sections:**
- Photo gallery (carousel with 5-10 images)
- Property title and location
- Key details: Bedrooms, bathrooms, max guests
- Pricing: Base price per night, cleaning fee
- Availability calendar (interactive)
- Full description
- Amenities list (WiFi, parking, kitchen, etc.)
- House rules
- Cancellation policy
- Reviews (future)
- "Request to Book" sticky button

### 4. Booking Page (`booking.html?property=xxx`)
**Purpose:** Complete booking request

**Form Fields:**
- Property summary (read-only)
- Date range picker
  - Check-in date
  - Check-out date
  - Number of nights (calculated)
- Guest information:
  - Full name
  - Email
  - Phone number
  - Number of guests
  - Message to host (optional)
- Price breakdown:
  - $X × Y nights = $Z
  - Cleaning fee: $X
  - Subtotal: $X
  - **Deposit (10%)**: $X (due now)
  - **Balance**: $X (due at check-in)
- Payment section:
  - Stripe card element
  - "By booking, you agree to house rules..."
- "Submit Booking Request" button

### 5. Booking Confirmation Page (`confirmation.html`)
**Purpose:** Post-booking success screen

**Content:**
- ✅ "Booking Request Submitted!"
- Booking details summary
- Status: "Pending Host Approval"
- Timeline:
  - Your host will review within 24 hours
  - You'll receive email when approved
  - $X deposit will be charged upon approval
- Confirmation email sent to [email]
- "View Booking Status" button (future: guest portal)

---

## 🔧 Backend API Endpoints

### Public APIs (No Auth Required)

```javascript
// Get public properties
GET /api/public/properties
Response: [{ id, slug, name, city, price, images, ... }]

// Get property by slug
GET /api/public/properties/:slug
Response: { full property details }

// Check availability
GET /api/public/properties/:slug/availability?checkIn=2025-03-15&checkOut=2025-03-20
Response: { available: true, price: 1000, nights: 5 }

// Create booking request (guest checkout)
POST /api/public/bookings/request
Body: {
  propertyId, checkIn, checkOut, guestName, guestEmail,
  guestPhone, numberOfGuests, guestMessage
}
Response: { bookingId, stripeClientSecret, depositAmount }

// Confirm payment (after Stripe success)
POST /api/public/bookings/:id/confirm-payment
Body: { stripePaymentIntentId }
Response: { success: true, confirmationCode }
```

### Host Dashboard APIs (Auth Required)

```javascript
// Get pending booking requests
GET /api/bookings?status=requested
Response: [{ id, property, guest, dates, amount, ... }]

// Approve booking request
POST /api/bookings/:id/approve
Response: { success: true, chargeId }

// Decline booking request
POST /api/bookings/:id/decline
Body: { reason }
Response: { success: true, refundId }

// Mark balance as paid
POST /api/bookings/:id/mark-balance-paid
Body: { paymentMethod: 'cash' | 'card' | 'venmo' }
Response: { success: true }
```

---

## 💰 Pricing Calculation Logic

### Example Booking:
- Property: Ocean View Condo
- Dates: March 15-20, 2025 (5 nights)
- Base price: $180/night
- Cleaning fee: $100
- Guests: 4

### Calculation:
```
Base rate:     $180 × 5 nights = $900
Cleaning fee:                    $100
─────────────────────────────────────
Subtotal:                        $1,000
─────────────────────────────────────
Deposit (10%):                   $100  ← Charged now via Stripe
Balance:                         $900  ← Due at check-in
```

### Dynamic Pricing (Future):
- Weekend rates (Friday/Saturday +20%)
- Holiday rates (+50%)
- Last-minute discounts (-15% if < 7 days)
- Weekly discount (7+ nights: -10%)
- Monthly discount (30+ nights: -20%)

---

## 📧 Email Notifications

### Automated Emails to Send:

**To Guest:**
1. **Booking Request Submitted**
   - Thank you for booking
   - Host will review within 24 hours
   - Deposit of $X will be charged upon approval

2. **Booking Approved**
   - Your booking is confirmed!
   - Deposit of $X charged successfully
   - Balance of $X due at check-in
   - Confirmation code: RFD-XXXXX
   - Check-in instructions

3. **Booking Declined**
   - Unfortunately, your request was declined
   - Reason: [host message]
   - No charge made
   - Browse other properties

**To Host:**
1. **New Booking Request**
   - Guest: John Doe wants to book Ocean View Condo
   - Dates: March 15-20 (5 nights)
   - Guests: 4
   - Total: $1,000
   - [Approve] [Decline] buttons

2. **Booking Confirmed**
   - John Doe's booking is confirmed
   - Deposit received: $100
   - Collect $900 at check-in

---

## 🎯 Phase 1 Implementation (This Week)

### Backend Tasks:
1. ✅ Add slug field to Property model
2. ✅ Create public property controller
3. ✅ Build booking request controller
4. ✅ Integrate Stripe PaymentIntent
5. ✅ Add booking approval/decline endpoints
6. ✅ Set up email service (SendGrid/Mailgun)

### Frontend Tasks:
1. ✅ Create public landing page
2. ✅ Build properties listing page
3. ✅ Build property detail page with gallery
4. ✅ Create booking form with date picker
5. ✅ Integrate Stripe Elements for payment
6. ✅ Build confirmation page
7. ✅ Add pending bookings to dashboard

### Testing Checklist:
- [ ] Guest can browse properties
- [ ] Guest can select dates and see pricing
- [ ] Guest can submit booking request
- [ ] Stripe authorizes card (doesn't charge)
- [ ] Host receives email notification
- [ ] Host can approve booking
- [ ] Stripe charges deposit on approval
- [ ] Guest receives confirmation email
- [ ] Host can decline booking
- [ ] Stripe refunds/cancels on decline

---

## 🚀 Future Enhancements (Phase 2+)

### Guest Portal:
- Guest login to view bookings
- Manage upcoming trips
- View past bookings
- Reviews/ratings

### Advanced Features:
- Calendar sync (iCal export)
- Smart pricing (dynamic rates)
- Promo codes/discounts
- Multi-property bookings
- Gift cards
- Referral program
- Insurance options
- Automated upsells (early check-in, late checkout)

### SEO & Marketing:
- Google Business integration
- Schema markup for rich snippets
- Social media sharing
- Email marketing campaigns
- Abandoned booking recovery

---

## 💡 Key Success Metrics

Track these KPIs:
- **Conversion rate**: Visitors → booking requests
- **Approval rate**: Requests → confirmed bookings
- **Average booking value**
- **Direct bookings vs. Airbnb bookings**
- **Total fees saved** (vs. 15% Airbnb fee)

---

## 🔐 Security Considerations

1. **PCI Compliance**: Use Stripe.js (never touch card data)
2. **Data validation**: Sanitize all guest inputs
3. **Rate limiting**: Prevent booking spam
4. **Email verification**: Verify guest emails
5. **Fraud detection**: Flag suspicious bookings

---

## ✅ Success Criteria

Before launching:
- [ ] Guest can complete full booking flow
- [ ] Payment processing works (Stripe test mode)
- [ ] Host receives email notifications
- [ ] Booking appears in dashboard
- [ ] Host can approve/decline
- [ ] Confirmation emails sent
- [ ] Calendar blocks dates
- [ ] Mobile responsive
- [ ] Fast page load (<3 seconds)
- [ ] SSL certificate installed

---

**Ready to build?** Let's start with the backend API first, then build the public-facing pages!
