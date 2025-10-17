# Google OAuth 2.0 Setup Guide

This guide will walk you through setting up Google Sign-In for A&A RentFlow.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Console Setup](#google-cloud-console-setup)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google Account
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Backend deployed or running locally
- Frontend deployed on S3 or running locally

---

## Google Cloud Console Setup

### Step 1: Create a New Project (or Select Existing)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown (top left)
3. Click **"New Project"**
4. Enter project name: `RentFlow` (or any name you prefer)
5. Click **"Create"**

### Step 2: Enable Google+ API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and click **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (unless you have a Google Workspace)
3. Click **"Create"**

#### Fill in App Information:

- **App name**: `A&A RentFlow`
- **User support email**: Your email address
- **App logo**: (Optional) Upload your logo
- **Application home page**: `https://aspiretowards.com`
- **Application privacy policy link**: `https://aspiretowards.com/privacy` (create this page later)
- **Application terms of service link**: `https://aspiretowards.com/terms` (create this page later)
- **Authorized domains**:
  - `aspiretowards.com` (this covers all subdomains like api.aspiretowards.com, www.aspiretowards.com, etc.)
- **Developer contact information**: Your email

4. Click **"Save and Continue"**

#### Scopes:

1. Click **"Add or Remove Scopes"**
2. Select these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
3. Click **"Update"** → **"Save and Continue"**

#### Test Users (for development):

1. Click **"Add Users"**
2. Add your email and any test users
3. Click **"Save and Continue"**

4. Review and click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**

#### Fill in the details:

**Name**: `RentFlow Web Client`

**Authorized JavaScript origins**:
- `http://localhost:8000` (for local testing)
- `https://aspiretowards.com` (your S3/CloudFront domain)

**Authorized redirect URIs**:
- `http://localhost:5000/api/auth/google/callback` (for local backend)
- `https://api.aspiretowards.com/api/auth/google/callback` (for production backend on EC2)

4. Click **"Create"**

### Step 5: Copy Credentials

After creating, you'll see a modal with:
- **Client ID**: Something like `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-xxxxxxxxxxxxx`

**📝 Keep these safe!** You'll need them in the next step.

---

## Backend Configuration

### Step 1: Update .env File

On your EC2 instance (or local backend), edit the `.env` file:

```bash
cd /path/to/backend
nano .env
```

Add/update these variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CALLBACK_URL=https://api.aspiretowards.com/api/auth/google/callback

# Frontend URL (for redirects after OAuth)
FRONTEND_URL=https://aspiretowards.com
```

**For Local Development:**
```env
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:8000
```

### Step 2: Verify Package Installation

The required packages are already in `package.json`:
- `passport`
- `passport-google-oauth20`

If you need to reinstall:

```bash
cd backend
npm install
```

### Step 3: Restart Backend Server

```bash
# If using PM2
pm2 restart rentflow-api

# If running directly
npm start

# If in development
npm run dev
```

---

## Frontend Configuration

### Step 1: Verify Config Files

Your frontend already has the configuration files set up:

**For S3/CloudFront (Production):**
- `/src/js/config.js` - Host dashboard
- `/public/js/config.js` - Public booking site

Both should point to:
```javascript
API_BASE_URL: 'https://api.aspiretowards.com'
```

**For Local Development:**
```javascript
API_BASE_URL: 'http://localhost:5000'
```

### Step 2: Deploy Frontend (if needed)

If you made changes to config files:

```bash
# Sync to S3
aws s3 sync ./src s3://your-bucket-name/src --delete
aws s3 sync ./public s3://your-bucket-name/public --delete

# If using CloudFront, invalidate cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Testing

### Step 1: Test Locally (Development)

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend should be running on `http://localhost:5000`

2. **Start Frontend:**
   ```bash
   # From project root
   python3 -m http.server 8000
   # Or use any static server
   ```

3. **Test Google Sign-In:**
   - Open browser: `http://localhost:8000/src/pages/auth/login.html`
   - Click **"Sign in with Google"**
   - Select your Google account
   - You should be redirected to the dashboard

### Step 2: Test in Production

1. **Navigate to Login:**
   - Go to `https://aspiretowards.com/src/pages/auth/login.html`
   - OR use the direct path on your S3/CloudFront URL

2. **Click "Sign in with Google"**

3. **Expected Flow:**
   ```
   Login Page
     ↓
   Redirects to Google Sign-In
     ↓
   User selects account & authorizes
     ↓
   Redirects to: api.aspiretowards.com/api/auth/google/callback
     ↓
   Backend creates/finds user, generates JWT tokens
     ↓
   Redirects to: aspiretowards.com/src/pages/auth/callback.html?token=...
     ↓
   Callback page stores tokens in localStorage
     ↓
   Redirects to: /src/pages/dashboard/dashboard.html
   ```

---

## Troubleshooting

### Issue: "Redirect URI Mismatch"

**Error Message:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Check **"Authorized redirect URIs"**
4. Ensure it **exactly matches** your backend callback URL:
   - Production: `https://api.aspiretowards.com/api/auth/google/callback`
   - Local: `http://localhost:5000/api/auth/google/callback`
5. **Note:** No trailing slashes, exact protocol (http vs https)

### Issue: "Invalid Client"

**Error Message:**
```
Error: invalid_client
```

**Solution:**
- Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Make sure there are no extra spaces or quotes
- Restart your backend server after updating `.env`

### Issue: CORS Error

**Error in Browser Console:**
```
Access to fetch at 'https://api.aspiretowards.com/api/auth/google' has been blocked by CORS policy
```

**Solution:**
1. Check `backend/src/server.js` CORS configuration
2. Ensure your S3 bucket URL is in `allowedOrigins`:
   ```javascript
   const allowedOrigins = [
     process.env.FRONTEND_URL,
     process.env.S3_BUCKET_URL,
     'http://localhost:8000',
     'http://127.0.0.1:8000'
   ].filter(Boolean)
   ```
3. Update `.env` to include:
   ```env
   S3_BUCKET_URL=https://your-bucket.s3.amazonaws.com
   ```

### Issue: User Gets Stuck on Callback Page

**Symptoms:**
- Page shows "Completing Sign In..." but doesn't redirect

**Solution:**
1. Open browser DevTools (F12) → Console
2. Check for JavaScript errors
3. Verify tokens are in the URL: `?token=xxx&refreshToken=yyy`
4. Check that `/api/auth/me` endpoint is accessible
5. Verify `config.js` has correct `API_BASE_URL`

### Issue: "Cannot GET /api/auth/google/callback"

**Error:** 404 on callback

**Solution:**
1. Ensure Passport is initialized in `server.js`:
   ```javascript
   const passport = require('./config/passport')
   app.use(passport.initialize())
   ```
2. Check that `authRoutes.js` includes Google routes
3. Restart backend server

---

## Security Best Practices

### 1. Environment Variables

✅ **DO:**
- Use environment variables for all secrets
- Never commit `.env` file to git
- Use different credentials for dev/staging/production

❌ **DON'T:**
- Hardcode credentials in source code
- Share credentials in documentation or chat

### 2. Callback URLs

✅ **DO:**
- Use HTTPS in production
- Whitelist only necessary domains
- Use specific paths, not wildcards

❌ **DON'T:**
- Use `http://` in production
- Allow `*` or overly broad patterns

### 3. OAuth Scopes

✅ **DO:**
- Request only needed scopes (email, profile)
- Document why each scope is needed

❌ **DON'T:**
- Request excessive permissions
- Change scopes without updating consent screen

---

## Advanced Configuration

### Using Google Sign-In on Public Booking Site

If you want to add Google Sign-In to `/public/` pages:

1. **Create a separate OAuth client** for guests (recommended)
2. **Or** use the same client with different callback path:
   ```
   https://api.aspiretowards.com/api/auth/google/callback/guest
   ```

3. **Add route** in `backend/src/routes/authRoutes.js`:
   ```javascript
   router.get('/google/guest', passport.authenticate('google', {
     scope: ['profile', 'email'],
     callbackURL: '/api/auth/google/callback/guest'
   }))

   router.get('/google/callback/guest',
     passport.authenticate('google', { session: false }),
     guestGoogleCallback
   )
   ```

---

## Monitoring & Analytics

### Track OAuth Events

Add logging to monitor Google Sign-In usage:

```javascript
// In passport.js strategy
console.log('📊 Google OAuth event:', {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
  newUser: !existingUser
})
```

### Google Analytics Integration

Track Google Sign-In conversions in GA4:

```javascript
// In callback.html
gtag('event', 'login', {
  method: 'Google',
  user_id: userData.id
})
```

---

## Next Steps

Once Google OAuth is working:

1. ✅ Test with multiple Google accounts
2. ✅ Implement email verification reminder
3. ✅ Add profile picture from Google
4. ✅ Allow unlinking Google account
5. ✅ Add other OAuth providers (Facebook, Apple)

---

## Support

If you encounter issues not covered here:

1. Check backend logs: `pm2 logs rentflow-api`
2. Check browser console for errors
3. Review Google Cloud Console error logs
4. Consult [Passport.js Google OAuth docs](http://www.passportjs.org/packages/passport-google-oauth20/)

---

**Implementation Complete!** 🎉

Your Google Sign-In is now fully configured and ready to use.
