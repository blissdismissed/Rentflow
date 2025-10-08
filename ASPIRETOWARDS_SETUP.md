# AspireTowards Direct Booking - Quick Setup Guide

## ✅ Branding Complete
All pages have been rebranded from "A&A Vacations" to **AspireTowards**!

---

## 🏔️ Your Bromley Mountain Property

I've created your first property listing with family-friendly marketing focused on:
- ✓ Bromley Mountain skiing (family-friendly slopes)
- ✓ Appalachian Trail access
- ✓ Small town Vermont charm
- ✓ 4-season family activities
- ✓ 3 bedrooms, 2 bathrooms, sleeps 8
- ✓ 2 balconies with mountain views

---

## 🚀 Setup Steps

### 1. Update the Seed Script with Your Email

Open: `backend/scripts/seed-bromley.js`

Change line 16:
```javascript
const USER_EMAIL = 'your@email.com' // <-- Change to your actual email
```

### 2. Run the Seed Script

```bash
# Make sure backend server is NOT running
# From project root:
node backend/scripts/seed-bromley.js
```

You should see:
```
🌱 Seeding Bromley Mountain property...
✅ Database connected
✅ Found user: [Your Name]
✅ Property created!
📍 Property ID: [uuid]

🎉 Success! View your property at:
   http://localhost:8000/public/property.html?slug=bromley-mountain-escape-2-balconies
```

### 3. Add Your Real Photos

The seed script uses placeholder images from Unsplash. To add your real Airbnb photos:

**Option A: Update via database**
```sql
UPDATE properties
SET
    images = ARRAY[
        'URL_TO_YOUR_IMAGE_1',
        'URL_TO_YOUR_IMAGE_2',
        'URL_TO_YOUR_IMAGE_3',
        'URL_TO_YOUR_IMAGE_4',
        'URL_TO_YOUR_IMAGE_5'
    ]::jsonb,
    "featuredImage" = 'URL_TO_YOUR_MAIN_IMAGE'
WHERE slug = 'bromley-mountain-escape-2-balconies';
```

**Option B: Add image upload to dashboard** (future enhancement)

---

## 🎨 What's Been Updated

### All Public Pages (`/public/`)
- ✅ `index.html` - Landing page
- ✅ `properties.html` - Browse properties
- ✅ `property.html` - Property details
- ✅ `booking.html` - Checkout
- ✅ `confirmation.html` - Success page

### Branding Changes
- **Name**: A&A Vacations → **AspireTowards**
- **Email**: book@aavacations.com → **info@aspiretowards.com**
- **Tagline**: "Mountain escapes and family-friendly vacation rentals"

---

## 📍 Your URLs

Once seeded, your property will be accessible at:

**Public booking site:**
- Homepage: `http://localhost:8000/public/index.html`
- Browse: `http://localhost:8000/public/properties.html`
- Bromley Property: `http://localhost:8000/public/property.html?slug=bromley-mountain-escape-2-balconies`

**Host dashboard:**
- Login: `http://localhost:8000/src/pages/auth/login.html`
- Bookings: `http://localhost:8000/src/pages/dashboard/bookings.html`

---

## 🎯 Property Details Created

**Bromley Mountain Escape**
- **Location**: Peru, Vermont
- **Bedrooms**: 3
- **Bathrooms**: 2
- **Sleeps**: 8 guests
- **Price**: $175/night
- **Cleaning Fee**: $100
- **Min Stay**: 2 nights
- **Max Stay**: 14 nights

**Marketing Highlights:**
- Family-friendly ski resort nearby (Bromley Mountain)
- Appalachian Trail access for hiking
- Small town Vermont charm
- 2 private balconies with mountain views
- Pet-friendly with approval
- 4-season activities

**Amenities:**
WiFi, Free parking, Kitchen, Washer/dryer, Heating, TV, Mountain views, Family-friendly, Near ski resort, Hiking nearby, Pet-friendly, Coffee maker, Dishwasher, Board games, and more!

---

## 🔄 Next Steps

### Immediate:
1. ✅ Run seed script to add property
2. 📸 Replace placeholder images with your Airbnb photos
3. 🔑 Add Stripe API keys to `.env` and `booking.html`
4. 🧪 Test the booking flow

### Optional Updates:
- Update exact address (currently placeholder)
- Add more photos (supports unlimited)
- Adjust pricing/rules
- Add seasonal pricing
- Update check-in instructions with real lockbox code

---

## 📝 Property Description

Your property description emphasizes:

🏔️ **Family Activities**
- Skiing at Bromley (gentle slopes for kids)
- Hiking the Appalachian Trail
- Small town exploration
- 4-season outdoor fun

👨‍👩‍👧‍👦 **Family-Friendly Features**
- Spacious (3BR/2BA)
- Full kitchen (save on dining out)
- Washer/dryer (pack light!)
- Game nights & movie space
- Safe neighborhood
- Pet-friendly

💰 **Value Proposition**
- Book direct & save
- Small family business
- No big corporation fees
- More affordable than resort hotels

---

## 🛠️ Customization

To edit your property later:

**Via Dashboard:**
(Future enhancement - property editing UI)

**Via Database:**
```sql
-- Update description
UPDATE properties
SET description = 'Your new description...'
WHERE slug = 'bromley-mountain-escape-2-balconies';

-- Update pricing
UPDATE properties
SET "basePrice" = 200.00, "cleaningFee" = 125.00
WHERE slug = 'bromley-mountain-escape-2-balconies';

-- Update amenities
UPDATE properties
SET amenities = ARRAY['WiFi', 'Parking', 'Hot Tub', ...]::jsonb
WHERE slug = 'bromley-mountain-escape-2-balconies';
```

---

## 📞 Contact Info

The public site now displays:
- **Email**: info@aspiretowards.com
- **Phone**: (555) 123-4567
- **Available**: 24/7

Update these in the footer of each public page or make them dynamic from your settings.

---

## 🎉 You're All Set!

Your AspireTowards direct booking site is ready with your Bromley Mountain property!

**Test the full flow:**
1. Browse properties → Click Bromley listing
2. Select dates → See pricing (10% deposit / 90% balance)
3. Fill guest info → Enter test Stripe card
4. Submit request → View pending in dashboard
5. Approve as host → Deposit charged
6. Guest receives confirmation!

**Need help?** All the code is documented and the DIRECT_BOOKING_SUMMARY.md has full technical details.

---

**Happy hosting! 🏔️⛷️🥾**
