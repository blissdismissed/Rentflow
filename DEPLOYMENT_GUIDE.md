# RentFlow Deployment Guide
## S3 Frontend + EC2 Backend Architecture

This guide walks you through deploying RentFlow with the frontend on S3 and backend on EC2.

---

## Architecture Overview

```
User Browser → S3 Static Website → EC2 Nginx (Port 80) → Node.js API (Port 5000 localhost)
```

**Benefits:**
- ✅ Cost-effective: S3 is cheaper than EC2 for static files
- ✅ Performance: S3 + CloudFront provides global CDN
- ✅ Security: Backend only accessible through Nginx reverse proxy
- ✅ Scalability: Each tier scales independently

---

## Part 1: EC2 Backend Setup

### Prerequisites
- Amazon Linux 2023 EC2 instance (t4g.micro ARM)
- Security Group: Allow ports 80, 443, 22
- SSH access to your EC2 instance

### Step 1: Install Dependencies

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Update system
sudo dnf update -y

# Install Node.js (use nvm for version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install PostgreSQL
sudo dnf install postgresql15-server postgresql15 -y
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
sudo dnf install nginx -y

# Install PM2 globally
npm install -g pm2
```

### Step 2: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE rentflow_db;
CREATE USER at_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rentflow_db TO at_user;
\q
```

### Step 3: Deploy Backend Code

```bash
# Clone your repository or upload files
cd ~
git clone your-repo-url
cd "A&A RentFlow"

# Install dependencies
cd backend
npm install --production

# Create production environment file
cp .env.production.example .env

# Edit .env with your production values
nano .env
```

**Important .env values to update:**
```bash
NODE_ENV=production
API_URL=http://YOUR_EC2_PUBLIC_IP
FRONTEND_URL=http://your-bucket-name.s3-website-us-east-1.amazonaws.com
S3_BUCKET_URL=http://your-bucket-name.s3-website-us-east-1.amazonaws.com

# Database
DB_HOST=localhost
DB_PASSWORD=your_secure_password

# Generate strong JWT secrets:
# Use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_secret
JWT_REFRESH_SECRET=your_generated_secret
```

### Step 4: Run Database Migrations

```bash
# If you have migrations
npm run migrate  # or your migration command

# Otherwise, the app will sync on first run (development mode only)
```

### Step 5: Configure Nginx

```bash
# Copy Nginx configuration
sudo cp ~/A\&A\ RentFlow/backend/nginx/rentflow.conf /etc/nginx/conf.d/

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 6: Start Node.js with PM2

```bash
# Start the application
cd ~/A\&A\ RentFlow
pm2 start backend/src/server.js --name rentflow

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u ec2-user --hp /home/ec2-user
# Run the command it outputs (starts with sudo)

# Check status
pm2 status
pm2 logs rentflow
```

### Step 7: Test Backend

```bash
# Test health endpoint
curl http://localhost/health

# Should return: {"status":"ok", ...}

# Test from your local machine
curl http://YOUR_EC2_PUBLIC_IP/health
```

---

## Part 2: S3 Frontend Setup

### Step 1: Prepare Frontend Files

**On your local machine:**

```bash
cd public

# Edit js/config.js - Update API_BASE_URL
nano js/config.js
```

Update `js/config.js`:
```javascript
const CONFIG = {
  API_BASE_URL: 'http://YOUR_EC2_PUBLIC_IP',  // Your EC2 public IP
  ENV: 'production',
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG: false,
}
```

### Step 2: Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://your-bucket-name

# Or use AWS Console:
# 1. Go to S3 → Create Bucket
# 2. Name: your-bucket-name
# 3. Region: us-east-1 (or your preference)
# 4. Uncheck "Block all public access"
# 5. Create bucket
```

### Step 3: Configure S3 for Static Website Hosting

**Via AWS Console:**
1. Select your bucket
2. Go to **Properties** tab
3. Scroll to **Static website hosting**
4. Enable it
5. Index document: `index.html`
6. Error document: `index.html` (for SPA routing)
7. Save changes
8. Note the **Bucket website endpoint** URL

### Step 4: Set Bucket Policy

```bash
# Replace YOUR-BUCKET-NAME
aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::your-bucket-name/*"
  }]
}'
```

**Or via Console:**
1. Go to **Permissions** tab
2. **Bucket Policy** → Edit
3. Paste the above policy (replace bucket name)
4. Save

### Step 5: Configure CORS

```bash
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'
```

### Step 6: Upload Frontend Files

```bash
# From your project root
cd public

# Upload all files to S3
aws s3 sync . s3://your-bucket-name/ --exclude ".DS_Store" --delete

# Or upload specific directories
aws s3 cp . s3://your-bucket-name/ --recursive
```

**Manual upload via Console:**
1. Select your bucket
2. Click **Upload**
3. Drag and drop all files from `public/` folder
4. Upload

### Step 7: Test Your Website

Visit: `http://your-bucket-name.s3-website-us-east-1.amazonaws.com`

---

## Part 3: Optional Enhancements

### A. Add CloudFront CDN (HTTPS + Performance)

1. **Create CloudFront Distribution:**
   - Origin: Your S3 bucket website endpoint
   - Enable HTTPS
   - Default cache behavior: GET, HEAD, OPTIONS
   - Viewer protocol policy: Redirect HTTP to HTTPS

2. **Update CORS:**
   Add CloudFront domain to backend `.env`:
   ```bash
   S3_BUCKET_URL=https://your-cloudfront-id.cloudfront.net
   ```

### B. Add Custom Domain

**For S3:**
1. Register domain (Route 53 or other)
2. Bucket name MUST match domain: `www.yourdomain.com`
3. Create Route 53 Alias record pointing to S3

**For EC2 API:**
1. Get Elastic IP for EC2
2. Create A record: `api.yourdomain.com` → Elastic IP
3. Update config:
   ```bash
   # Backend .env
   API_URL=https://api.yourdomain.com

   # Frontend config.js
   API_BASE_URL: 'https://api.yourdomain.com'
   ```

### C. Add SSL/HTTPS with Let's Encrypt

```bash
# On EC2
sudo dnf install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is setup automatically
sudo certbot renew --dry-run
```

---

## Deployment Checklist

### Backend (EC2)
- [ ] EC2 instance running with security group (ports 80, 443, 22)
- [ ] PostgreSQL installed and database created
- [ ] Node.js and PM2 installed
- [ ] Nginx installed and configured
- [ ] `.env` file configured with production values
- [ ] Backend code deployed and npm packages installed
- [ ] PM2 running backend application
- [ ] Nginx proxying to localhost:5000
- [ ] Health check working: `curl http://YOUR_EC2_IP/health`

### Frontend (S3)
- [ ] S3 bucket created and configured for static hosting
- [ ] Bucket policy allows public read access
- [ ] CORS configured
- [ ] `js/config.js` updated with EC2 IP
- [ ] All frontend files uploaded to S3
- [ ] Website accessible via S3 URL
- [ ] API calls working from frontend to backend

### Security
- [ ] JWT secrets are strong and unique
- [ ] Database password is secure
- [ ] `.env` file is not committed to git
- [ ] EC2 security group restricts SSH to your IP only
- [ ] Rate limiting enabled in Nginx
- [ ] HTTPS enabled (optional but recommended)

---

## Maintenance Commands

### Backend (EC2)

```bash
# View logs
pm2 logs rentflow

# Restart application
pm2 restart rentflow

# View Nginx logs
sudo tail -f /var/log/nginx/rentflow-error.log

# Restart Nginx
sudo systemctl restart nginx

# Update code
cd ~/A\&A\ RentFlow
git pull
cd backend
npm install --production
pm2 restart rentflow
```

### Frontend (S3)

```bash
# Update frontend
cd public
nano js/config.js  # If needed
aws s3 sync . s3://your-bucket-name/ --delete

# Clear CloudFront cache (if using)
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Troubleshooting

### Backend not responding
```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs rentflow --lines 100

# Check if Node.js is listening
sudo netstat -tlnp | grep 5000

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
```

### CORS errors
```bash
# Verify .env has correct S3_BUCKET_URL
cat backend/.env | grep S3_BUCKET_URL

# Check browser console for exact origin
# Add that origin to .env
```

### Database connection errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U at_user -d rentflow_db
```

---

## Cost Estimate (Monthly)

- **EC2 t4g.micro**: ~$6-7/month (free tier: first year free)
- **S3 Storage (5GB)**: ~$0.12/month
- **S3 Requests (100k)**: ~$0.04/month
- **Data Transfer (10GB)**: ~$0.90/month
- **Total**: ~$7-8/month (after free tier)

With CloudFront: Add ~$1-2/month for small traffic

---

## Next Steps

1. Setup monitoring (CloudWatch, PM2 monitoring)
2. Configure automated backups (PostgreSQL + S3)
3. Setup CI/CD pipeline (GitHub Actions)
4. Add analytics (Google Analytics, Plausible)
5. Consider adding CloudFront for HTTPS + CDN
6. Get a custom domain name

---

## Support

For issues or questions:
- Check logs: `pm2 logs rentflow`
- Review Nginx logs: `/var/log/nginx/rentflow-error.log`
- Verify configuration files
- Check AWS Security Groups and IAM permissions
