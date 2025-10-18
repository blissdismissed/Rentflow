# S3 Sync Strategy - Protecting Property Images

## The Problem

When using `aws s3 sync . s3://aspiretowards.com/ --delete`, the `--delete` flag will remove files in S3 that don't exist locally, which would delete all property images uploaded through the dashboard.

## Solution: Separate S3 Buckets/Paths

### Recommended Approach: Use Separate Buckets

**Static Website Content:**
```
Bucket: aspiretowards.com
Purpose: Static website files (HTML, CSS, JS)
Sync Method: aws s3 sync with --delete
```

**User-Generated Content:**
```
Bucket: rentflow-uploads (or aspiretowards-uploads)
Purpose: Property images, user uploads
Sync Method: Never use --delete; managed via API only
```

### Configuration

**Environment Variables:**
```bash
# Static website bucket
WEBSITE_S3_BUCKET=aspiretowards.com

# User uploads bucket
AWS_S3_BUCKET=rentflow-uploads

# Optional: CloudFront distribution for uploads
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

**Directory Structure in Uploads Bucket:**
```
rentflow-uploads/
├── properties/
│   ├── {property-uuid-1}/
│   │   ├── images/
│   │   │   ├── {image-uuid-1}-timestamp.jpg
│   │   │   ├── {image-uuid-2}-timestamp.jpg
│   │   │   └── ...
│   │   └── thumbnails/
│   │       ├── {image-uuid-1}-timestamp.jpg
│   │       └── ...
│   ├── {property-uuid-2}/
│   │   └── ...
│   └── ...
├── users/
│   ├── {user-uuid}/
│   │   └── avatar.jpg
│   └── ...
└── documents/
    └── ...
```

---

## Deployment Workflow

### 1. Deploy Static Website (Frontend Code)

```bash
# Navigate to your frontend directory
cd /path/to/frontend

# Sync to website bucket with --delete
aws s3 sync . s3://aspiretowards.com/ \
  --delete \
  --exclude ".git/*" \
  --exclude "node_modules/*" \
  --exclude ".env*" \
  --cache-control "max-age=31536000,public" \
  --content-type "text/html" \
  --exclude "*" \
  --include "*.html"

# Sync JS files
aws s3 sync ./js s3://aspiretowards.com/js/ \
  --delete \
  --cache-control "max-age=31536000,public" \
  --content-type "application/javascript"

# Sync CSS files
aws s3 sync ./css s3://aspiretowards.com/css/ \
  --delete \
  --cache-control "max-age=31536000,public" \
  --content-type "text/css"
```

### 2. User Uploads (Property Images)

**Never sync manually!** Images are managed exclusively through the API:

```bash
# ❌ NEVER DO THIS:
aws s3 sync . s3://rentflow-uploads/ --delete

# ✅ Instead, use the dashboard UI or API:
POST /api/properties/:id/images (upload)
DELETE /api/properties/:id/images/:imageId (delete)
```

---

## Alternative: Use Exclusions in Same Bucket

If you must use a single bucket, use exclusions:

```bash
# Sync website files but exclude upload directories
aws s3 sync . s3://aspiretowards.com/ \
  --delete \
  --exclude "properties/*" \
  --exclude "uploads/*" \
  --exclude "user-content/*"
```

**Bucket Structure:**
```
aspiretowards.com/
├── index.html
├── css/
├── js/
├── public/
├── properties/          ← EXCLUDED from sync
│   └── {uuid}/
│       └── images/
└── uploads/             ← EXCLUDED from sync
    └── ...
```

**Updated Sync Command:**
```bash
#!/bin/bash
# deploy-website.sh

# Sync HTML files
aws s3 sync . s3://aspiretowards.com/ \
  --exclude "*" \
  --include "*.html" \
  --include "*.css" \
  --include "*.js" \
  --include "public/*" \
  --delete \
  --cache-control "max-age=3600,public"

# DO NOT delete property images
echo "✅ Website deployed (property images preserved)"
```

---

## S3 Bucket Policy for Security

### Uploads Bucket Policy

Make property images publicly readable but only writable via API:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rentflow-uploads/properties/*"
    },
    {
      "Sid": "AllowAPIServerWrite",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/rentflow-api-server"
      },
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::rentflow-uploads/*"
    }
  ]
}
```

### CORS Configuration

Enable CORS for upload bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:8000",
      "https://aspiretowards.com",
      "https://www.aspiretowards.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## CloudFront Setup (Optional but Recommended)

### Benefits:
- **Faster image delivery** via CDN
- **Cost savings** on S3 bandwidth
- **Custom domain** (e.g., cdn.aspiretowards.com)
- **HTTPS** for all images

### Setup:

1. **Create CloudFront Distribution:**
   - Origin: `rentflow-uploads.s3.amazonaws.com`
   - Origin Path: Leave empty
   - Viewer Protocol Policy: Redirect HTTP to HTTPS

2. **Update Environment Variable:**
   ```bash
   AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
   # or with custom domain:
   AWS_CLOUDFRONT_URL=https://cdn.aspiretowards.com
   ```

3. **Image URLs will now be:**
   ```
   https://d1234567890.cloudfront.net/properties/{uuid}/images/{filename}
   ```

---

## Migration: Move Existing Images to New Bucket

If you already have images in `aspiretowards.com` bucket:

```bash
#!/bin/bash
# migrate-images.sh

# Copy all property images to new bucket
aws s3 cp \
  s3://aspiretowards.com/properties/ \
  s3://rentflow-uploads/properties/ \
  --recursive \
  --acl public-read

# Verify the copy
aws s3 ls s3://rentflow-uploads/properties/ --recursive

# Once verified, you can remove from old bucket:
# aws s3 rm s3://aspiretowards.com/properties/ --recursive
```

**Update Database:**
```sql
-- Update image URLs in database
UPDATE properties
SET
  "featuredImage" = REPLACE("featuredImage",
    'aspiretowards.com/properties',
    'rentflow-uploads.s3.us-east-1.amazonaws.com/properties'),
  "images" = -- Update JSONB array URLs similarly
WHERE "featuredImage" IS NOT NULL;
```

---

## Recommended Final Setup

### Environment Configuration

```bash
# .env
NODE_ENV=production

# Static Website
WEBSITE_S3_BUCKET=aspiretowards.com
FRONTEND_URL=https://aspiretowards.com

# User Uploads
AWS_S3_BUCKET=rentflow-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
AWS_CLOUDFRONT_URL=https://cdn.aspiretowards.com  # Optional CDN
```

### Deployment Scripts

**deploy-frontend.sh:**
```bash
#!/bin/bash
set -e

echo "🚀 Deploying frontend to S3..."

# Sync all website files except upload directories
aws s3 sync ./public s3://aspiretowards.com/ \
  --delete \
  --exclude "properties/*" \
  --cache-control "max-age=3600" \
  --profile rentflow

# Invalidate CloudFront cache if using CDN
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*" \
  --profile rentflow

echo "✅ Frontend deployed successfully"
echo "⚠️  Property images remain untouched in rentflow-uploads bucket"
```

**Image Management:**
- ✅ Upload via dashboard: `POST /api/properties/:id/images`
- ✅ Delete via dashboard: `DELETE /api/properties/:id/images/:imageId`
- ❌ Never use `aws s3 sync` for uploads bucket

---

## Summary

### ✅ DO:
- Use separate buckets for static content vs. uploads
- Sync static website with `--delete` flag
- Manage property images exclusively via API
- Use CloudFront for image delivery
- Set proper CORS and bucket policies

### ❌ DON'T:
- Use `--delete` flag on uploads bucket
- Manually upload property images to S3
- Mix static assets with user uploads in same path
- Expose S3 credentials to frontend

---

**Last Updated:** 2025-10-18
