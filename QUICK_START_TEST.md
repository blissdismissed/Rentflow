# Quick Start - Test Your Booking Pipeline

## 🚀 5-Minute Setup

### 1. Update Environment Variables

Edit `/backend/.env` with real credentials:

```bash
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Get from: https://app.sendgrid.com/settings/api_keys
SENDGRID_API_KEY=SG.YOUR_KEY_HERE

# Must be verified in SendGrid: https://app.sendgrid.com/settings/sender_auth
FROM_EMAIL=your-verified-email@example.com
```

### 2. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # if not already done
npm run dev
```
Expected output: `🚀 Server running on 0.0.0.0:5000`

**Terminal 2 - Frontend:**
```bash
cd /Users/ishhhb/Documents/Programming/A\&A\ RentFlow
python3 -m http.server 8000
```
Expected output: `Serving HTTP on 0.0.0.0 port 8000`

### 3. Verify Database Has Test Property

Run this query to check:
```sql
SELECT id, slug, name, "basePrice", "publiclyVisible", "isActive", status
FROM properties
WHERE "publiclyVisible" = true
  AND "isActive" = true
  AND status = 'active';
```

If empty, create a test property in your dashboard first.

---

## 🧪 Quick Test (2 Minutes)

### Test the Complete Flow:

1. **Browse**: http://localhost:8000/public/properties.html
   - Should show your test property

2. **Select Dates**: Click on property → Choose tomorrow + 2 nights

3. **Book**:
   - Fill name: "Test Guest"
   - Email: **YOUR_EMAIL** (you must have access to this)
   - Card: `4242 4242 4242 4242`, Exp: `12/25`, CVC: `123`
   - Submit

4. **Check Email** (Host email):
   - Subject: "New Booking Request for [Property]"
   - Should arrive within 30 seconds

5. **Approve**: http://localhost:8000/dashboard/bookings.html
   - Login as host
   - Click "Approve & Charge Deposit"

6. **Check Email** (Guest email):
   - Subject: "Booking Confirmed!"
   - Should arrive within 30 seconds

### ✅ Success Indicators:
- Two emails received (host + guest)
- Dashboard shows "Confirmed" status
- Deposit marked as "Paid"
- No errors in terminal

---

## 🐛 Quick Troubleshooting

### "Property not found"
→ Make sure property has `publiclyVisible=true`, `isActive=true`, `status='active'`

### "Email not sending"
→ Check terminal for errors. Verify SendGrid API key and FROM_EMAIL are correct.
→ Check spam folder.

### "Stripe error"
→ Verify you're using TEST keys (start with `sk_test_` and `pk_test_`)
→ Get keys from: https://dashboard.stripe.com/test/apikeys

### "Card declined"
→ Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)

---

## 📝 Test Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 8000
- [ ] `.env` has valid Stripe test keys
- [ ] `.env` has valid SendGrid API key
- [ ] `FROM_EMAIL` is verified in SendGrid
- [ ] Database has at least one public property
- [ ] Host user account exists with valid email
- [ ] Property linked to host user

---

## 📊 What You're Testing

**Complete Pipeline:**
```
Guest browses → Selects dates → Books with card
    ↓
Host receives email notification
    ↓
Host approves in dashboard
    ↓
Stripe charges deposit (10%)
    ↓
Guest receives confirmation email
    ↓
Guest arrives, pays balance (90%)
    ↓
Host marks balance paid
    ↓
Complete! 💰
```

---

## 🎯 Key Test Points

1. **Email to Host** - Verify you receive booking notification
2. **Email to Guest** - Verify guest receives confirmation
3. **Stripe Charge** - Check dashboard.stripe.com/test/payments for $X charge
4. **Booking Status** - Changes from "Requested" → "Confirmed"
5. **Payment Tracking** - Deposit marked paid, balance tracked

---

## 📚 Full Documentation

- **Complete Test Guide**: `/docs/BOOKING_PIPELINE_TEST_GUIDE.md`
- **Implementation Summary**: `/docs/IMPLEMENTATION_SUMMARY.md`
- **API Endpoints**: Check controller files in `/backend/src/controllers/`

---

## 🆘 Need Help?

**Check logs:**
```bash
# Backend terminal shows:
✓ "Booking request email sent to host: user@example.com"
✓ "Booking approval email sent to guest: guest@example.com"

# Stripe dashboard:
https://dashboard.stripe.com/test/payments
```

**Common issues documented in:**
`/docs/BOOKING_PIPELINE_TEST_GUIDE.md` (Troubleshooting section)

---

**Happy Testing! 🎉**
