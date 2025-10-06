# 🚀 RentFlow Quick Start Guide

Get your RentFlow development environment up and running in **15 minutes**!

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- [ ] **PostgreSQL** (v13 or higher) - [Download](https://www.postgresql.org/download/)
- [ ] **npm** (v9 or higher) - Comes with Node.js
- [ ] **Git** - [Download](https://git-scm.com/)
- [ ] **Code Editor** - VS Code recommended

Verify installations:
```bash
node --version  # Should be v18.x.x or higher
npm --version   # Should be v9.x.x or higher
psql --version  # Should be v13.x or higher
```

## Step 1: Database Setup (5 minutes)

### Create PostgreSQL Database

**Option A: Using psql command line**
```bash
# Start PostgreSQL (if not running)
# macOS:
brew services start postgresql

# Linux:
sudo service postgresql start

# Create database and user
psql postgres

# In psql prompt:
CREATE DATABASE rentflow_db;
CREATE USER rentflow_user WITH PASSWORD 'rentflow_dev_2024';
GRANT ALL PRIVILEGES ON DATABASE rentflow_db TO rentflow_user;
\q
```

**Option B: Using GUI (pgAdmin, TablePlus, etc.)**
1. Connect to PostgreSQL server
2. Create new database: `rentflow_db`
3. Create new user: `rentflow_user` with password `rentflow_dev_2024`
4. Grant all privileges on `rentflow_db` to `rentflow_user`

## Step 2: Backend Setup (5 minutes)

### Install Dependencies & Configure

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Configure Environment Variables

Edit `backend/.env`:

```env
# Minimal configuration for local development
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:8000

# Database (use the credentials you created)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rentflow_db
DB_USER=rentflow_user
DB_PASSWORD=rentflow_dev_2024

# JWT (use these for development, change in production)
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dev_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth (optional - get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Run Database Migrations

```bash
# From backend directory
npm run migrate

# Expected output: ✅ Database synchronized
```

### Start Backend Server

```bash
npm run dev

# Expected output:
# ✅ Database connection established successfully
# ✅ Database synchronized
# 🚀 Server running on port 5000
```

**Test the backend:**
```bash
# In a new terminal
curl http://localhost:5000/health

# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

## Step 3: Frontend Setup (3 minutes)

### Install Dependencies

```bash
# Navigate to root directory
cd ..

# Install frontend dependencies
npm install
```

### Start Frontend Server

```bash
npm run dev

# Server starts on http://localhost:8000
```

## Step 4: Test the Application (2 minutes)

### Open in Browser

Visit these URLs to verify everything works:

1. **Homepage**: http://localhost:8000/
   - Should see the RentFlow dashboard

2. **Signup Page**: http://localhost:8000/signup.html
   - Should see the registration form

3. **Login Page**: http://localhost:8000/login.html
   - Should see the login form

4. **API Health Check**: http://localhost:5000/health
   - Should see JSON status response

### Create Your First User

1. Go to http://localhost:8000/signup.html
2. Fill in the form:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Password: password123
   - Confirm Password: password123
   - Check "I agree to Terms"
3. Click "Create account"
4. You should be redirected to the dashboard

### Test Login

1. Go to http://localhost:8000/login.html
2. Enter:
   - Email: john@example.com
   - Password: password123
3. Click "Sign in"
4. You should see the dashboard

## Common Issues & Solutions

### Issue: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find and kill the process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change the port in backend/.env
PORT=5001
```

### Issue: Database Connection Failed

**Error**: `Unable to connect to database`

**Solution**:
```bash
# Verify PostgreSQL is running
psql postgres -c "SELECT version();"

# Verify credentials in .env match your database
# Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
```

### Issue: npm install fails

**Error**: Various npm errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Database migration fails

**Error**: Migration errors

**Solution**:
```bash
# Drop and recreate database
psql postgres
DROP DATABASE rentflow_db;
CREATE DATABASE rentflow_db;
GRANT ALL PRIVILEGES ON DATABASE rentflow_db TO rentflow_user;
\q

# Run migrations again
npm run migrate
```

## Next Steps

Now that your environment is running:

### 1. Explore the Codebase
```
backend/
├── src/
│   ├── models/       # Database models
│   ├── controllers/  # Business logic
│   ├── routes/       # API endpoints
│   └── middleware/   # Auth & validation
```

### 2. Read the Documentation
- **BUILD_SUMMARY.md** - What's been built
- **IMPLEMENTATION_GUIDE.md** - What to build next
- **design-system.md** - UI/UX guidelines
- **PROJECT_README.md** - Complete project docs

### 3. Set Up Optional Services

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

#### Stripe (For payments - Optional)
1. Sign up at [Stripe](https://stripe.com)
2. Get test API keys from Dashboard
3. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   ```

### 4. Start Development

Follow the **IMPLEMENTATION_GUIDE.md** for the full development roadmap.

**Recommended order:**
1. Build "Add Property" wizard
2. Implement booking system
3. Add payment integration
4. Build channel integrations

## Development Commands

### Backend
```bash
cd backend

npm run dev          # Start development server
npm run test         # Run tests
npm run lint         # Check code style
npm run migrate      # Run database migrations
```

### Frontend
```bash
npm run dev          # Start frontend server
npm run test         # Run frontend tests
npm run build        # Build for production
```

## Environment Variables Reference

### Required for Development
```env
NODE_ENV=development
PORT=5000
DB_NAME=rentflow_db
DB_USER=rentflow_user
DB_PASSWORD=your_password
JWT_SECRET=your_secret
```

### Optional (for full features)
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Useful Development Tools

### Database GUI Tools
- **pgAdmin** - https://www.pgadmin.org/
- **TablePlus** - https://tableplus.com/
- **DBeaver** - https://dbeaver.io/

### API Testing
- **Postman** - https://www.postman.com/
- **Insomnia** - https://insomnia.rest/
- **curl** - Command line tool

### VS Code Extensions
- ESLint
- Prettier
- PostgreSQL
- REST Client
- GitLens

## Quick Testing with curl

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Authenticated Endpoint
```bash
# Save token from login response
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Support

- 📖 **Documentation**: See all .md files in root directory
- 🐛 **Issues**: Check IMPLEMENTATION_GUIDE.md for troubleshooting
- 💬 **Questions**: Review PROJECT_README.md for details

---

**You're all set! 🎉**

Your RentFlow development environment is now running. Start building amazing features!

**Next**: Read the **IMPLEMENTATION_GUIDE.md** to see what to build next.
