# Property Editing Guide

## Overview

You can now edit your property details directly from the dashboard! This includes updating:
- ✅ Property name and description
- ✅ Location details
- ✅ Property specs (bedrooms, bathrooms, guests)
- ✅ Pricing (base price, cleaning fee, security deposit)
- ✅ Images (via S3 upload)
- ✅ Amenities
- ✅ House rules
- ✅ Check-in instructions
- ✅ Cancellation policy
- ✅ Visibility settings

## How to Edit a Property

### Step 1: Access the Editor

1. Log in to your dashboard at `https://aspiretowards.com/dashboard.html`
2. Click on "Total Properties" card to expand your properties list
3. Click the **"Edit"** button on the property you want to modify

### Step 2: Update Property Details

The property editor has several sections:

#### Basic Information
- Property name (what guests see as the title)
- Property type (condo, house, apartment, etc.)
- Description (supports emojis and formatting)

#### Location
- Full address details
- City, State, Zip Code, Country

#### Property Details
- Number of bedrooms and bathrooms
- Maximum guests
- Square footage

#### Pricing
- Base price per night
- Cleaning fee
- Security deposit
- Minimum and maximum night stays

#### Images
**Important**: Images are stored on S3 and organized by property ID.

Your property ID is displayed in the editor. To update images:

1. Note your property ID from the blue box in the Images section
2. Upload images to S3 at: `/assets/properties/{your-property-id}/`
3. Name your images (recommended names):
   - `main.jpg` - Main hero image (required)
   - `living-room.jpg`
   - `bedroom.jpg`
   - `kitchen.jpg`
   - `exterior.jpg`
   - Add more as needed

4. The property page will automatically load images from this S3 path

**Image Requirements:**
- Format: JPG or PNG
- Recommended size: 1200x800px for main, 800x600px for others
- Make sure files are publicly readable in S3

#### Amenities
- Select from common amenities (WiFi, Kitchen, Parking, etc.)
- Add custom amenities using the text box

#### House Rules
- Smoking policy
- Party/event policy
- Quiet hours
- Pet policy
- Any special requirements

#### Check-in Instructions
- Check-in/check-out times
- Access instructions (lockbox codes, key locations)
- WiFi details
- Emergency contacts

#### Cancellation Policy
- Flexible: Free cancellation up to 24 hours before
- Moderate: Free cancellation up to 5 days before
- Strict: Free cancellation up to 14 days before

#### Visibility
- **Publicly Visible**: Show on the properties listing page
- **Active**: Property is accepting bookings

### Step 3: Save Changes

1. Review all your changes
2. Click **"Save Changes"**
3. You'll be redirected back to the dashboard
4. Changes are immediate - view your property page to verify

## Image Management Workflow

### Current Setup (Manual S3 Upload)
This is the recommended approach for now:

1. **Edit property** → Note the property ID
2. **Upload to S3** → Upload images to `/assets/properties/{id}/`
3. **Name consistently** → Use descriptive names (main.jpg, bedroom.jpg, etc.)
4. **Verify** → Check the property page to see images load

### Why This Approach?
- ✅ Direct control over image quality
- ✅ No file size limits from backend
- ✅ Faster uploads (direct to S3)
- ✅ Better organization (UUID-based folders)
- ✅ No temporary storage on EC2

## Tips for Best Results

### Writing Descriptions
- Use emojis for visual appeal (🏔️ ☀️ 🍂)
- Break into sections (Winter, Summer, Fall)
- Highlight unique features
- Mention nearby attractions
- Include booking benefits (save 15%, crypto discount)

### Pricing Strategy
- **Base Price**: Your nightly rate
- **Cleaning Fee**: One-time fee per stay
- **Security Deposit**: Refundable deposit
- **Min/Max Nights**: Control booking lengths

### Amenities
- Be comprehensive - list everything
- Guests search by amenities
- Add unique items that set you apart

### Images
- First image is the hero image (most important!)
- Show variety: exterior, living areas, bedrooms, kitchen
- Good lighting and clean spaces photograph best
- 4-8 images is ideal

## Troubleshooting

### "Failed to load property"
- Check that you're logged in
- Verify the property belongs to your account
- Check browser console for errors

### "Images not showing"
- Verify S3 upload path matches property ID
- Check file names match database URLs
- Ensure S3 files are publicly readable
- Hard refresh browser (Ctrl+Shift+R)

### "Failed to update property"
- Check all required fields are filled
- Verify prices are positive numbers
- Check min nights ≤ max nights
- Review browser console for validation errors

## Future Enhancements

Planned features:
- [ ] Direct image upload from editor
- [ ] Image cropping and optimization
- [ ] Drag-and-drop image reordering
- [ ] Bulk image delete
- [ ] Calendar integration for blocked dates
- [ ] Preview mode before saving

## Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Verify your internet connection
3. Try logging out and back in
4. Contact support with property ID and error details
