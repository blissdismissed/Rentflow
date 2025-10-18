# Complete Booking Pipeline - Test Guide

## Overview
This guide walks you through testing the complete direct booking pipeline from browsing properties to payment confirmation.

## Prerequisites

### 1. Environment Setup

Ensure your `.env` file has valid credentials:

```bash
# Required for testing
STRIPE_SECRET_KEY=sk_test_...        # Get from Stripe Dashboard
STRIPE_PUBLISHABLE_KEY=pk_test_...   # Get from Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_...      # Get after setting up webhook
SENDGRID_API_KEY=SG....              # Get from SendGrid Dashboard
FROM_EMAIL=noreply@rentflow.com      # Verified sender in SendGrid
```

### 2. Database Setup

Make sure you have at least one property configured:
- Set `publiclyVisible = true`
- Set `isActive = true`
- Set `status = 'active'`
- Has a valid `slug`
- Has pricing (`basePrice`, optionally `cleaningFee`)
- Belongs to a user with valid email

### 3. Start the Backend Server

```bash
cd backend
npm run dev
```

Server should be running on `http://localhost:5000`

### 4. Start the Frontend Server

```bash
cd ..
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Frontend should be accessible at `http://localhost:8000`

---

## Complete Booking Flow Test

### Step 1: Browse Properties

1. Open `http://localhost:8000/public/index.html`
2. Click "View Properties" or navigate to `http://localhost:8000/public/properties.html`
3. Verify:
   - Properties are loading from the API
   - Images display correctly
   - Prices are visible
   - Filter/sort controls work

### Step 2: View Property Details

1. Click on a property to view details
2. URL should be: `http://localhost:8000/public/property.html?slug=YOUR-PROPERTY-SLUG`
3. Verify:
   - Property details load correctly
   - Image gallery works
   - Amenities display
   - Date picker is functional
   - Blocked dates are disabled (if any existing bookings)

### Step 3: Select Dates & Check Availability

1. Click on the check-in date picker
2. Select a check-in date (tomorrow or later)
3. Select a check-out date (at least 1 night later)
4. Enter number of guests
5. Click "Check Availability"
6. Verify:
   - Price calculation appears:
     - Base price × nights
     - Cleaning fee (if applicable)
     - Total amount
     - 10% deposit amount
     - 90% balance amount
   - API call: `GET /api/public/properties/:slug/availability?checkIn=...&checkOut=...`
   - Response shows `available: true` and pricing breakdown

### Step 4: Proceed to Booking

1. Click "Book Now" or "Reserve"
2. Should redirect to: `http://localhost:8000/public/booking.html?propertyId=...&checkIn=...&checkOut=...&guests=...`
3. Verify:
   - Booking form displays with pre-filled dates
   - Price summary shows on sidebar
   - Stripe card element loads correctly

### Step 5: Submit Booking Request

1. Fill in guest information:
   - Full name: "Test Guest"
   - Email: YOUR_TEST_EMAIL (you should have access to this)
   - Phone: Optional
   - Message to host: Optional
2. Enter Stripe test card:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
3. Check "I agree to the terms and conditions"
4. Click "Confirm Booking"

**Expected Backend Actions:**
- API call: `POST /api/public/bookings/request`
- Creates booking with `bookingStatus = 'requested'`, `status = 'pending'`
- Creates Stripe PaymentIntent (manual capture mode)
- **Sends email to host** with booking details
- Returns `confirmationCode`

**Verify:**
- Redirect to confirmation page
- Console logs show: "Booking request email sent to host: [host-email]"
- Check host email inbox for booking request notification

### Step 6: Confirmation Page

1. Should redirect to: `http://localhost:8000/public/confirmation.html?code=RFD-XXXXXXXX`
2. Verify:
   - Success animation displays
   - Confirmation code shows
   - Booking status: "Pending Approval"
   - Payment summary shows:
     - Total amount
     - Deposit authorized (not charged)
     - Balance due at check-in
   - "What happens next" timeline displays

**Check Host Email:**
- Subject: "New Booking Request for [Property Name]"
- Contains:
  - Guest information
  - Dates and nights
  - Pricing breakdown
  - Deposit status: "Authorized (not charged yet)"
  - Link to dashboard

### Step 7: Host Reviews Booking (Dashboard)

1. Log in to host dashboard: `http://localhost:8000/dashboard/bookings.html`
2. Find the new booking (should have yellow highlight)
3. Verify:
   - Guest details display
   - Guest message (if provided)
   - Dates and pricing
   - Deposit status: "Authorized"
   - Two buttons: "Approve & Charge Deposit" and "Decline"

### Step 8A: Approve Booking (Happy Path)

1. Click "Approve & Charge Deposit"
2. Confirm the action

**Expected Backend Actions:**
- API call: `POST /api/bookings/:id/approve`
- Stripe captures the deposit (charges the card)
- Updates booking:
  - `bookingStatus = 'approved'`
  - `status = 'confirmed'`
  - `depositPaid = true`
  - `depositPaidAt = now`
  - `paymentStatus = 'partial'`
- **Sends confirmation email to guest**

**Verify:**
- Dashboard shows success message
- Booking status changes to "Confirmed"
- Deposit status: "Paid"
- Console logs: "Booking approval email sent to guest: [guest-email]"
- Check guest email inbox

**Check Guest Email:**
- Subject: "Booking Confirmed! [Property Name] - RFD-XXXXXXXX"
- Contains:
  - ✓ Success icon
  - Confirmation code
  - "Deposit Charged" notice
  - Reservation details
  - Payment summary (deposit paid ✓, balance due)
  - Check-in instructions (if configured)
  - House rules (if configured)

### Step 8B: Decline Booking (Alternative Path)

If testing the decline flow instead:

1. Click "Decline" button
2. Enter a reason: "Property maintenance scheduled for those dates"
3. Click "Submit"

**Expected Backend Actions:**
- API call: `POST /api/bookings/:id/decline`
- Stripe cancels PaymentIntent (releases authorization)
- Updates booking:
  - `bookingStatus = 'declined'`
  - `status = 'cancelled'`
  - `hostMessage = reason`
- **Sends decline email to guest**

**Verify:**
- Dashboard shows success message
- Booking status: "Declined"
- Console logs: "Booking decline email sent to guest: [guest-email]"
- Check guest email inbox

**Check Guest Email:**
- Subject: "Booking Update - [Property Name]"
- Contains:
  - Apology message
  - "No Charge" notice (authorization released)
  - Booking details
  - Host's message/reason
  - Link to browse other properties

### Step 9: Mark Balance Paid (On Check-in Day)

1. In the dashboard, find the confirmed booking
2. Click "Mark Balance Paid"
3. Select payment method: "Cash", "Card", or "Venmo"
4. Confirm

**Expected Backend Actions:**
- API call: `POST /api/bookings/:id/mark-balance-paid`
- Updates booking:
  - `balancePaid = true`
  - `balancePaidAt = now`
  - `paymentStatus = 'paid'`

**Verify:**
- Payment status changes to "Paid"
- Balance status shows checkmark

---

## Testing Stripe Webhooks (Optional Advanced Testing)

### Setup Stripe CLI

1. Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# or
# Download from https://stripe.com/docs/stripe-cli
```

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

This will output a webhook signing secret like: `whsec_xxxxx`

4. Update `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

5. Restart the backend server

### Test Webhook Events

When you approve a booking, Stripe will send events that the CLI forwards to your local server.

**Monitor logs for:**
- `payment_intent.succeeded` - When deposit is captured
- `charge.succeeded` - When charge completes

**Verify in console:**
```
PaymentIntent succeeded: pi_xxxxx
Deposit payment confirmed for booking RFD-XXXXXXXX
Charge succeeded: ch_xxxxx
Charge confirmed for booking RFD-XXXXXXXX
```

---

## Verification Checklist

### ✅ Frontend
- [ ] Properties listing loads and displays
- [ ] Property detail page shows all info
- [ ] Date picker blocks unavailable dates
- [ ] Availability check calculates pricing correctly
- [ ] Booking form validates required fields
- [ ] Stripe card element loads and works
- [ ] Confirmation page displays after booking
- [ ] Seasonal themes display based on dates

### ✅ Backend API
- [ ] `GET /api/public/properties` returns active properties
- [ ] `GET /api/public/properties/:slug` returns property + booked dates
- [ ] `GET /api/public/properties/:slug/availability` validates and prices
- [ ] `POST /api/public/bookings/request` creates booking + PaymentIntent
- [ ] `GET /api/public/bookings/:code` returns booking by confirmation code
- [ ] `POST /api/bookings/:id/approve` captures deposit
- [ ] `POST /api/bookings/:id/decline` cancels PaymentIntent
- [ ] `POST /api/bookings/:id/mark-balance-paid` records payment

### ✅ Email Notifications
- [ ] Host receives email when booking requested
- [ ] Guest receives confirmation when approved
- [ ] Guest receives decline notice when rejected
- [ ] Emails contain all relevant information
- [ ] Emails are formatted properly (HTML + plain text)

### ✅ Stripe Integration
- [ ] PaymentIntent created with manual capture
- [ ] Card authorization succeeds (test mode)
- [ ] Deposit capture succeeds on approval
- [ ] PaymentIntent canceled on decline
- [ ] Webhooks process correctly (if configured)

### ✅ Dashboard
- [ ] Pending bookings show with yellow highlight
- [ ] Approve button works and charges deposit
- [ ] Decline button works and releases authorization
- [ ] Mark balance paid updates status
- [ ] Statistics update correctly
- [ ] Filter by status works

---

## Common Issues & Troubleshooting

### Issue: "Property not found"
**Solution:** Ensure property has:
- `publiclyVisible = true`
- `isActive = true`
- `status = 'active'`
- Valid `slug`

### Issue: "Property not available"
**Solution:** Check for conflicting bookings in database with overlapping dates

### Issue: "Stripe key error"
**Solution:**
- Verify `STRIPE_SECRET_KEY` starts with `sk_test_`
- Verify `STRIPE_PUBLISHABLE_KEY` starts with `pk_test_`
- Get keys from https://dashboard.stripe.com/test/apikeys

### Issue: "Email not sending"
**Solution:**
- Verify `SENDGRID_API_KEY` is valid
- Verify `FROM_EMAIL` is verified in SendGrid
- Check console for error messages
- Emails may be in spam folder

### Issue: "Webhook signature verification failed"
**Solution:**
- Ensure webhook secret matches Stripe CLI output
- Restart backend after updating `.env`
- Webhook routes must come BEFORE `express.json()` middleware

### Issue: "Card declined"
**Solution:** Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- More: https://stripe.com/docs/testing

---

## Test Data Recommendations

### Create Test Properties

For comprehensive testing, create properties with:
1. **Standard Property**: Normal pricing, 2-night minimum
2. **Luxury Property**: High price, cleaning fee, 3-night minimum
3. **Budget Property**: Low price, no cleaning fee, 1-night minimum

### Create Test Bookings

Test different scenarios:
1. **Standard booking**: 3 nights, approved
2. **Declined booking**: Requested but host declines
3. **Conflicting dates**: Try to book overlapping dates
4. **Min/max nights**: Test validation

### Create Test Users

1. **Host account**: Your primary email (to receive notifications)
2. **Guest email**: Secondary email you can access
3. **Admin account**: For testing multi-property scenarios

---

## Performance Testing

### Load Testing (Optional)

Test concurrent bookings:

```bash
# Install Apache Bench
brew install httpd

# Test availability endpoint
ab -n 100 -c 10 http://localhost:5000/api/public/properties/test-slug/availability?checkIn=2025-06-01&checkOut=2025-06-05

# Monitor for race conditions in booking conflicts
```

### Database Queries

Monitor slow queries:

```sql
-- Check for booking conflicts (should use indexes)
EXPLAIN ANALYZE
SELECT * FROM bookings
WHERE "propertyId" = 'xxx'
  AND status IN ('confirmed', 'checked_in', 'requested')
  AND ("checkIn" BETWEEN '2025-06-01' AND '2025-06-05'
    OR "checkOut" BETWEEN '2025-06-01' AND '2025-06-05');
```

---

## Next Steps After Testing

### Production Deployment Checklist

- [ ] Replace Stripe test keys with live keys
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Set up real Stripe webhook endpoint
- [ ] Configure production email sender
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Enable SSL/HTTPS
- [ ] Configure production database
- [ ] Set `NODE_ENV=production`
- [ ] Review rate limiting settings
- [ ] Test on mobile devices
- [ ] Perform security audit
- [ ] Set up automated backups

### Recommended Enhancements

1. **SMS Notifications**: Add Twilio for SMS alerts
2. **Calendar Sync**: iCal export for guest calendar
3. **Review System**: Guest reviews after checkout
4. **Dynamic Pricing**: Seasonal rates, weekday/weekend pricing
5. **Promo Codes**: Discount code system
6. **Multi-currency**: Support international guests
7. **Guest Portal**: Self-service booking management
8. **Automated Reminders**: Balance due, check-in approaching
9. **Cancellation Handling**: Refund policies based on timing
10. **Analytics Dashboard**: Booking trends, revenue forecasting

---

## Support & Documentation

- **Stripe Docs**: https://stripe.com/docs
- **SendGrid Docs**: https://docs.sendgrid.com
- **API Reference**: See `/docs/API_REFERENCE.md` (if available)
- **Database Schema**: See `/docs/DATABASE_SCHEMA.md` (if available)

---

**Last Updated**: 2025-10-18
**Version**: 1.0.0
