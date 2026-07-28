# Rentflow

[![Tests](https://github.com/blissdismissed/Rentflow/actions/workflows/ci.yml/badge.svg)](https://github.com/blissdismissed/Rentflow/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/blissdismissed/Rentflow/graph/badge.svg)](https://codecov.io/gh/blissdismissed/Rentflow)

Property management and vacation rental platform for managing short-term rental properties.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
│    public/ (HTML/JS/CSS) ──► AWS S3 (static host)  │
│    frontend/ (React/Vite) ──► in progress           │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│  AWS EC2                                            │
│    Nginx (port 80/443)  ──► reverse proxy           │
│    Node.js/Express (port 5000, pm2)                 │
│    PostgreSQL                                       │
└─────────────────────────────────────────────────────┘
```

- **Frontend (live):** Static HTML/JS/CSS in `public/`, hosted on AWS S3
- **Frontend (in progress):** React/Vite app in `frontend/` — not yet deployed
- **Backend API:** Node.js + Express in `backend/`, running on EC2 via pm2 behind Nginx
- **Database:** PostgreSQL (on EC2)
- **API domain:** `https://api.aspiretowards.com`

---

## Local Development

### Prerequisites

- Node.js >= 18
- PostgreSQL running locally
- A local DB user and database created

### 1. Clone and install

```bash
git clone <repo-url>
cd Rentflow
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your local values (see Environment Variables section)
npm install
```

Create the local database (one time):

```bash
psql -U postgres -c "CREATE USER rentflow_user WITH PASSWORD 'yourpassword';"
psql -U postgres -c "CREATE DATABASE rentflow_db OWNER rentflow_user;"
```

Run migrations:

```bash
npm run migrate
```

Start the backend (with hot reload):

```bash
npm run dev
# Server runs at http://localhost:5000
```

### 3. Frontend (static HTML) setup

The `public/` directory is the live frontend. To serve it locally:

```bash
# From the project root — any static server works, e.g.:
npx serve public -p 8000
# or
python3 -m http.server 8000 --directory public
```

Make sure `public/js/config.js` is using the **development config** (uncomment the dev block, comment out the production block):

```js
// Development config — use this locally
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
  ENV: 'development',
  ENABLE_DEBUG: true,
}
```

Open `http://localhost:8000` in your browser.

### 4. Frontend (React/Vite — in progress)

```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## Environment Variables

All variables live in `backend/.env`. Copy from `backend/.env.example` to start.

### Required

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `5000`) |
| `FRONTEND_URL` | URL of the frontend (`http://localhost:8000` locally, S3 URL in prod) |
| `S3_BUCKET_URL` | Full S3 bucket URL (used for CORS allowlist) |
| `DB_HOST` | Postgres host |
| `DB_PORT` | Postgres port (default `5432`) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_DIALECT` | `postgres` |
| `JWT_SECRET` | Secret key for signing JWTs — use a long random string |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `7d`) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g. `30d`) |
| `SENDGRID_API_KEY` | SendGrid API key for transactional email |
| `FROM_EMAIL` | Sender email address |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth redirect (e.g. `https://api.aspiretowards.com/api/auth/google/callback`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_...` or `pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PIN_ENCRYPTION_KEY` | 32-byte key for encrypting lock PINs — generate with `openssl rand -base64 32` |

### Optional / Feature-specific

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | AWS access key (for S3 image uploads) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name for uploads |
| `LOG_LEVEL` | Winston log level (`info`, `debug`, `error`) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default `900000` = 15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window (default `100`) |

---

## npm Scripts (run from `backend/`)

| Command | What it does |
|---|---|
| `npm run dev` | Start backend with nodemon (hot reload) |
| `npm start` | Start backend without hot reload (production) |
| `npm run migrate` | Run all pending DB migrations |
| `npm run migrate:undo` | Roll back the last migration |
| `npm test` | Run Jest test suite with coverage |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint backend source files |
| `npm run lint:fix` | Auto-fix lint issues |

---

## Database Migrations

Migrations live in `backend/src/migrations/`. Always use migrations — never `sequelize.sync({ force: true })` in production.

```bash
# Run all pending migrations
cd backend && npm run migrate

# Roll back the most recent migration
cd backend && npm run migrate:undo

# Check which migrations have run
cd backend && npx sequelize-cli db:migrate:status
```

### Seeding local data

```bash
# Add your local user first by registering on the local site, then:
node backend/scripts/seed-bromley.js    # Vermont property
node backend/scripts/seed-caribbean.js  # Myrtle Beach property (Caribbean-1225)
```

---

## Production — AWS EC2

The backend runs on an EC2 instance behind Nginx with SSL via Let's Encrypt.

### SSH in

```bash
ssh -i your-key.pem ec2-user@<ec2-public-ip>
```

### Deploying backend changes

```bash
# On EC2 — pull latest code
cd /var/www/aspiretowards/Rentflow
git pull origin master

# Go to backend directory
cd backend

# Install any new dependencies
npm install --production

# Run new migrations

npm run migrate

# Restart the app
pm2 restart rentflow

# Check it's running
pm2 status
pm2 logs rentflow --lines 50
```

### Deploying frontend (static HTML) changes

The `public/` directory is hosted on S3. After making changes locally:

1. **Swap config.js to production** — make sure `public/js/config.js` has the production `CONFIG` block active (not the dev localhost one)
2. **Upload to S3** via the AWS console or CLI:
   ```bash
   aws s3 sync public/ s3://your-bucket-name/ --delete
   ```
3. **If using CloudFront**, invalidate the cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
   ```
4. **Switch config.js back to development** locally after deploying

### Nginx

Config lives at `/etc/nginx/conf.d/rentflow.conf` on the EC2 instance. Local reference copy: `backend/nginx/rentflow.conf`.

```bash
# Test nginx config
sudo nginx -t

# Reload nginx (no downtime)
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View nginx logs
sudo tail -f /var/log/nginx/rentflow-error.log
sudo tail -f /var/log/nginx/rentflow-access.log
```

### SSL Certificate (Let's Encrypt / Certbot)

Certs expire every 90 days. Auto-renewal is handled by a systemd timer.

```bash
# Check cert status
sudo certbot certificates

# Check auto-renewal timer
sudo systemctl status certbot-renew.timer

# Force manual renewal (e.g. if cert has expired)
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### pm2 — Process Management

pm2 keeps the Node.js server alive and restarts it on crashes or reboots.

```bash
pm2 status                        # Show all processes
pm2 restart rentflow              # Restart the app
pm2 stop rentflow                 # Stop the app
pm2 logs rentflow --lines 100     # View recent logs
pm2 logs rentflow --follow        # Stream live logs
pm2 monit                         # Live dashboard
pm2 startup                       # Generate startup script (run once after first deploy)
pm2 save                          # Save current process list for startup
```

---

## Debugging

### Backend not responding

```bash
# 1. Check pm2
pm2 status
pm2 logs rentflow --lines 50

# 2. Check if port 5000 is listening
ss -tlnp | grep 5000

# 3. Test directly (bypass nginx)
curl http://localhost:5000/health

# 4. Check nginx
sudo systemctl status nginx
sudo nginx -t
```

### SSL errors / cert expired

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Database connection errors

```bash
# On EC2, check postgres is running
sudo systemctl status postgresql

# Test connection manually
psql -U rentflow_user -d rentflow_db -h localhost
```

### CORS errors in browser

The backend CORS allowlist is configured in `backend/src/server.js`. Make sure `FRONTEND_URL` and `S3_BUCKET_URL` env vars are set correctly on the EC2 instance. After changing env vars, restart pm2.

### Frontend hitting wrong API

Check `public/js/config.js` — the active `CONFIG` block must have the correct `API_BASE_URL`. Locally it should be `http://localhost:5000`; in production it should be `https://api.aspiretowards.com`.

---

## Key File Locations

| Path | What it is |
|---|---|
| `backend/src/server.js` | Express app entry point, middleware, route registration |
| `backend/src/models/` | Sequelize models |
| `backend/src/controllers/` | Route handlers |
| `backend/src/routes/` | Express routers |
| `backend/src/migrations/` | Database migration files |
| `backend/src/config/database.js` | Sequelize connection config |
| `backend/src/config/passport.js` | Google OAuth config |
| `backend/scripts/` | One-off seed and utility scripts |
| `backend/nginx/rentflow.conf` | Reference copy of the nginx config |
| `public/` | Live static frontend (HTML/JS/CSS) |
| `public/js/config.js` | Frontend environment config — swap dev/prod here |
| `frontend/` | New React/Vite frontend (in progress, not yet deployed) |
