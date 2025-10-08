# Airbnb Integration Setup Guide

## Overview

A&A RentFlow now supports full **two-way integration** with Airbnb, allowing you to:
- ✅ Automatically sync listings from Airbnb
- ✅ Pull reservations and booking data
- ✅ Push availability and pricing updates
- ✅ Centralized management of all properties

## Prerequisites

1. An active Airbnb Host account
2. At least one published listing on Airbnb
3. Access to Airbnb API credentials (requires Airbnb Partner application)

## Step 1: Register for Airbnb API Access

### Apply for API Access
1. Go to [Airbnb Developer Platform](https://www.airbnb.com/partner)
2. Click "Apply for API Access"
3. Fill out the application form:
   - **Application Type**: Property Management System (PMS)
   - **Business Name**: A&A RentFlow
   - **Use Case**: Property management and booking synchronization
   - **Expected API Calls**: ~1000 per day per user

### Wait for Approval
- Airbnb typically reviews applications within **5-10 business days**
- You'll receive an email with your API credentials once approved

### Get Your Credentials
Once approved, you'll receive:
- **Client ID** (e.g., `abc123xyz789`)
- **Client Secret** (e.g., `secret_abc123xyz789`)

## Step 2: Configure Environment Variables

1. Navigate to your backend directory:
   ```bash
   cd backend
   ```

2. Update your `.env` file with Airbnb credentials:
   ```env
   # Airbnb API
   AIRBNB_CLIENT_ID=your_actual_client_id
   AIRBNB_CLIENT_SECRET=your_actual_client_secret
   AIRBNB_REDIRECT_URI=http://localhost:5000/api/integrations/airbnb/callback
   ```

3. For production, update the redirect URI:
   ```env
   AIRBNB_REDIRECT_URI=https://yourdomain.com/api/integrations/airbnb/callback
   ```

## Step 3: Register Redirect URI with Airbnb

1. Log into Airbnb Partner Dashboard
2. Go to **App Settings** → **OAuth Settings**
3. Add your redirect URI:
   - Development: `http://localhost:5000/api/integrations/airbnb/callback`
   - Production: `https://yourdomain.com/api/integrations/airbnb/callback`
4. Save changes

## Step 4: Run Database Migrations

The integration requires new database fields. Run migrations:

```bash
cd backend
npm run migrate
```

Or manually add these fields if needed:

**Properties table:**
- `externalId` (STRING) - Airbnb listing ID
- `platform` (STRING) - Source platform name
- `isActive` (BOOLEAN) - Active status
- `propertyType` (STRING) - Detailed property type
- `minNights` (INTEGER) - Minimum nights
- `maxNights` (INTEGER) - Maximum nights

**Bookings table:**
- `externalId` (STRING) - Airbnb confirmation code
- `platform` (STRING) - Source platform
- `platformFee` (DECIMAL) - Platform fees
- `netAmount` (DECIMAL) - Net payout amount
- `metadata` (JSONB) - Additional platform data

## Step 5: Start the Backend Server

```bash
cd backend
npm start
```

The server should start on `http://localhost:5000`

## Step 6: Connect Airbnb Account

### From the Dashboard:

1. Log into your A&A RentFlow account
2. Navigate to **Dashboard** → **Integrations**
3. Find the **Airbnb** card
4. Click **"Connect Airbnb"**
5. You'll be redirected to Airbnb to authorize the connection
6. Log in with your Airbnb Host account
7. Grant the requested permissions:
   - Read listing information
   - Read and write calendar data
   - Read reservation details
   - Update pricing
8. After authorization, you'll be redirected back to A&A RentFlow
9. Your listings will automatically start syncing!

## How It Works

### OAuth Flow
1. User clicks "Connect Airbnb"
2. Backend generates authorization URL with OAuth state token
3. User is redirected to Airbnb login
4. User grants permissions
5. Airbnb redirects back with authorization code
6. Backend exchanges code for access token
7. Access token is stored securely in database
8. Initial sync begins automatically

### Automatic Syncing

Once connected, A&A RentFlow will:

**Initial Sync (Automatic):**
- Import all your Airbnb listings
- Pull past 90 days of reservations
- Fetch upcoming 365 days of bookings

**Ongoing Sync:**
- Sync new reservations every 15 minutes
- Update listing details daily
- Push availability changes immediately
- Update pricing when modified

## Using the Integration

### View Synced Listings
1. Go to **Dashboard** → **Properties**
2. Listings synced from Airbnb will show an Airbnb icon
3. External ID will display the Airbnb listing ID

### Manual Sync
1. Go to **Dashboard** → **Integrations**
2. Find Airbnb card
3. Click **"Sync Now"**
4. Wait for sync to complete

### Update Availability
1. Edit availability on A&A RentFlow calendar
2. Changes automatically push to Airbnb within minutes
3. Check Airbnb calendar to confirm update

### Update Pricing
1. Update property pricing on A&A RentFlow
2. Click "Push to Airbnb"
3. New pricing will appear on Airbnb within minutes

## Troubleshooting

### "Failed to connect Airbnb"
- Check that your Client ID and Secret are correct
- Verify redirect URI matches exactly in `.env` and Airbnb dashboard
- Ensure your Airbnb API application is approved and active

### "Token expired" errors
- Tokens refresh automatically
- If issues persist, disconnect and reconnect Airbnb

### Listings not syncing
- Check Integration status in dashboard
- Look for error messages in sync status
- Verify listings are published on Airbnb
- Try manual sync

### Bookings not appearing
- Ensure reservations are confirmed on Airbnb
- Check date range (90 days back, 365 days forward)
- Verify booking status is not "pending" or "cancelled"

## API Endpoints

### Connect Airbnb
```
POST /api/integrations/airbnb/connect
Authorization: Bearer {token}
```

### OAuth Callback
```
GET /api/integrations/airbnb/callback?code={code}&state={state}
```

### Disconnect
```
POST /api/integrations/airbnb/disconnect
Authorization: Bearer {token}
```

### Manual Sync
```
POST /api/integrations/{integrationId}/sync
Authorization: Bearer {token}
```

### Get Status
```
GET /api/integrations/{integrationId}/status
Authorization: Bearer {token}
```

## Security Notes

- Access tokens are stored encrypted in the database
- Tokens are never exposed to the frontend
- OAuth state tokens prevent CSRF attacks
- All API calls use HTTPS in production
- Tokens auto-refresh before expiration

## Limitations

### Current Limitations:
- One Airbnb account per user
- Maximum 100 listings per account
- Sync interval: 15 minutes minimum
- Historical data: 90 days back

### Coming Soon:
- Webhooks for real-time updates
- Multiple Airbnb accounts per user
- Custom sync intervals
- Bulk operations

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Airbnb API documentation
3. Contact support@rentflow.com
4. Check GitHub issues: https://github.com/yourusername/rentflow/issues

## Next Steps

After setting up Airbnb:
- [ ] Connect VRBO account (coming soon)
- [ ] Set up automated pricing rules
- [ ] Configure webhook notifications
- [ ] Enable multi-calendar sync
