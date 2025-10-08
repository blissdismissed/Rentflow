# Frontend API URL Update Instructions

## Files that need manual updates before S3 deployment:

### Public Pages (Already include config.js or need it added)

#### 1. `/public/properties.html`
- Add before closing `</body>`: `<script src="js/config.js"></script>`
- Replace: `const API_URL = 'http://localhost:5000/api/public/properties'`
- With: `const response = await fetch(apiUrl('/api/public/properties'))`

#### 2. `/public/property.html`
- Add before script: `<script src="js/config.js"></script>`
- Replace all `http://localhost:5000/api/public/...` with `apiUrl('/api/public/...')`

#### 3. `/public/booking.html`
- Add: `<script src="js/config.js"></script>`
- Replace API URLs with `apiUrl()` helper

#### 4. `/public/confirmation.html`
- Add: `<script src="js/config.js"></script>`
- Replace API URLs with `apiUrl()` helper

### Dashboard Pages (Need different path to config.js)

#### 5. `/src/pages/auth/login.html`
- Add: `<script src="/public/js/config.js"></script>` OR `<script src="../../../public/js/config.js"></script>`
- Replace: `const API_URL = 'http://localhost:5000/api'`
- With: Use `apiUrl('/api/auth/login')` etc.

#### 6. `/src/pages/auth/signup.html`
- Same as login.html

#### 7-8. Dashboard pages (`/src/pages/dashboard/*.html`)
- Add config.js reference (adjust path based on your build setup)
- Replace hardcoded URLs with `apiUrl()` helper

---

## Quick Find & Replace Guide

### Step 1: Add config.js to all HTML files

**For public/ folder files:**
```html
<!-- Add before your main script -->
<script src="js/config.js"></script>
```

**For src/ folder files:**
```html
<!-- Adjust path based on your folder structure -->
<script src="../../../public/js/config.js"></script>
<!-- OR if you copy config.js to each folder -->
<script src="config.js"></script>
```

### Step 2: Replace hardcoded URLs

**Find:**
```javascript
const API_URL = 'http://localhost:5000/api/public/properties'
const response = await fetch(API_URL)
```

**Replace with:**
```javascript
const response = await fetch(apiUrl('/api/public/properties'))
```

**Find:**
```javascript
fetch('http://localhost:5000/api/auth/login', {
```

**Replace with:**
```javascript
fetch(apiUrl('/api/auth/login'), {
```

---

## Automated Approach (Alternative)

Instead of manually updating each file, you can:

1. **Create a build script** that:
   - Copies all HTML files
   - Replaces `http://localhost:5000` with environment variable
   - Outputs to a `dist/` folder for S3 deployment

2. **Use environment variable in config.js:**
   ```javascript
   const CONFIG = {
     API_BASE_URL: window.ENV_API_URL || 'http://localhost:5000'
   }
   ```

3. **Create two versions of config.js:**
   - `config.dev.js` - for local development
   - `config.prod.js` - for S3 deployment
   - Copy the appropriate one during build

---

## Recommended: Simple Copy Script

For S3 deployment, just update `public/js/config.js` once:

```javascript
const CONFIG = {
  API_BASE_URL: 'http://YOUR_EC2_PUBLIC_IP',
  ENV: 'production',
  ENABLE_DEBUG: false,
}
```

Then update HTML files as needed per the list above.

---

## After Updates

Test locally:
```bash
# In one terminal - start backend
cd backend
npm start

# In another terminal - serve frontend
cd public
python3 -m http.server 8000

# Visit: http://localhost:8000
# Check browser console for API calls
```

Deploy to S3:
```bash
cd public
aws s3 sync . s3://your-bucket-name/ --delete
```
