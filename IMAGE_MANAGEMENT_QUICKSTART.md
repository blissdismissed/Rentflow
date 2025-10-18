# Image Management - Quick Start Guide

## 🎉 What's Been Implemented

A complete image management system for your direct booking pages with:

✅ **Drag & drop** image uploads
✅ **Automatic optimization** (resize + compress)
✅ **Thumbnail generation** for fast loading
✅ **Drag to reorder** images
✅ **Set cover photo** with one click
✅ **Add captions** to images
✅ **Delete images** with confirmation
✅ **S3 storage** with CDN-ready URLs

---

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies

```bash
cd backend
npm install  # sharp and multer are already added to package.json
```

### 2. Configure AWS S3

Create an S3 bucket for uploads (separate from your website bucket):

```bash
aws s3 mb s3://rentflow-uploads --region us-east-1
```

Update `/backend/.env`:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=rentflow-uploads
```

### 3. Set S3 Bucket Policy

Make images publicly readable:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::rentflow-uploads/properties/*"
  }]
}
```

Apply via AWS Console: Bucket → Permissions → Bucket Policy

### 4. Configure CORS

Enable cross-origin uploads:

```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedOrigins": ["http://localhost:8000", "https://aspiretowards.com"],
  "ExposeHeaders": ["ETag"]
}]
```

Apply via AWS Console: Bucket → Permissions → CORS

### 5. Start Your Server

```bash
cd backend
npm run dev
```

### 6. Test It Out!

1. Navigate to: `http://localhost:8000/src/pages/dashboard/properties.html`
2. Login to dashboard
3. Click on a property
4. Add `?id={property-uuid}` to URL: `property-edit.html?id=xxx`
5. Upload images!

---

## 📁 Files Created/Modified

### Backend
```
backend/src/
├── services/
│   └── imageService.js              ✨ NEW - S3 upload & optimization
├── middleware/
│   └── upload.js                    ✨ NEW - Multer config
├── controllers/
│   └── propertyController.js        📝 UPDATED - Added image endpoints
└── routes/
    └── propertyRoutes.js            📝 UPDATED - Added image routes
```

### Frontend
```
src/pages/dashboard/
├── property-edit.html               ✨ NEW - Image management UI
└── property-edit.js                 ✨ NEW - Upload & drag-drop logic
```

### Documentation
```
docs/
├── IMAGE_MANAGEMENT_GUIDE.md        ✨ Complete technical guide
├── S3_SYNC_STRATEGY.md              ✨ S3 deployment best practices
└── IMAGE_MANAGEMENT_QUICKSTART.md   ✨ This file
```

---

## 🎨 Dashboard UI Preview

```
┌─────────────────────────────────────────────────────┐
│  Edit Property Name                     ← Back      │
├─────────────────────────────────────────────────────┤
│  [Images] [Details] [Pricing]                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  📤  Drop images here or click to upload   │   │
│  │     PNG, JPG, WebP up to 10MB (max 10)    │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │ ★ Cover│ │        │ │        │ │        │      │
│  │  Photo │ │ Image2 │ │ Image3 │ │ Image4 │      │
│  │        │ │        │ │        │ │        │      │
│  │ [...]  │ │ [...]  │ │ [...]  │ │ [...]  │      │
│  └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                      │
│  Drag images to reorder • Click [...] for actions  │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 API Endpoints

All endpoints require authentication (`Bearer <token>`):

```
POST   /api/properties/:id/images              Upload images
DELETE /api/properties/:id/images/:imageId     Delete image
PUT    /api/properties/:id/images/reorder      Reorder images
PUT    /api/properties/:id/images/:imageId/featured   Set cover photo
PUT    /api/properties/:id/images/:imageId/caption    Update caption
```

---

## 🔍 How It Works

### Upload Flow

```
1. User selects files → Drag/drop or click upload
2. Validate files → Type, size, count checks
3. Create FormData → Append files as "images" field
4. POST to API → With progress tracking
5. Backend receives → Multer parses multipart data
6. Process images → Sharp optimization + thumbnail
7. Upload to S3 → Both full-size and thumbnail
8. Save metadata → Update property.images JSONB array
9. Return URLs → Frontend displays new images
```

### Storage Structure

```
S3 Bucket: rentflow-uploads/
└── properties/
    └── {property-uuid}/
        ├── images/
        │   ├── {image-uuid}-timestamp.jpg  ← Full size (optimized)
        │   └── ...
        └── thumbnails/
            ├── {image-uuid}-timestamp.jpg  ← 400x300px
            └── ...
```

### Database Structure

```javascript
// Property record
{
  id: "property-uuid",
  name: "Beach House",
  featuredImage: "https://bucket.../images/main.jpg",  // Cover photo
  images: [  // JSONB array
    {
      id: "img-uuid-1",
      url: "https://bucket.../images/abc-123.jpg",
      thumbnailUrl: "https://bucket.../thumbnails/abc-123.jpg",
      key: "properties/123/images/abc-123.jpg",
      caption: "Living room with ocean view",
      isFeatured: true,
      width: 1920,
      height: 1080,
      size: 245678,
      order: 0
    },
    // ... more images
  ]
}
```

---

## 🚨 Important: S3 Sync Strategy

### ⚠️ The Problem

If you're using:
```bash
aws s3 sync . s3://aspiretowards.com/ --delete
```

The `--delete` flag will **remove property images** uploaded via dashboard!

### ✅ The Solution

**Option 1: Separate Buckets (Recommended)**

```bash
# Static website content
aws s3 sync . s3://aspiretowards.com/ --delete

# User uploads (never sync with --delete)
# Managed exclusively via API
```

**Option 2: Use Exclusions**

```bash
aws s3 sync . s3://aspiretowards.com/ \
  --delete \
  --exclude "properties/*"  # Preserve uploaded images
```

📖 **Read more:** `/docs/S3_SYNC_STRATEGY.md`

---

## 🎯 Feature Highlights

### 1. Automatic Optimization

- **Resize** to max 1920px width
- **Compress** to 85% quality (JPEG)
- **Progressive** encoding
- **~60-80% size reduction** on average

### 2. Drag-and-Drop Reordering

- Uses **SortableJS** library
- **Visual feedback** during drag
- **Auto-saves** on drop
- **Touch-friendly** for mobile

### 3. Featured Image Selection

- **Purple badge** shows cover photo
- **One-click** to change
- **Auto-fallback** if deleted

### 4. Progress Tracking

- **Real-time** upload progress bar
- **Percentage** display
- **Multi-file** batch upload

---

## 📱 User Experience

### For Property Managers

1. **Upload**
   - Drag 10 photos from desktop
   - Wait 5-10 seconds for processing
   - Images appear in grid automatically

2. **Reorder**
   - Drag first image to position 3
   - Release mouse
   - Order saved instantly

3. **Set Cover**
   - Click "Actions" on image
   - Select "Set as Cover Photo"
   - Purple badge appears

4. **Delete**
   - Click "Actions" on image
   - Select "Delete Image"
   - Confirm dialog
   - Image removed from S3 + database

### For Guests (Public Site)

- **Fast loading** with thumbnails
- **High quality** full-size images
- **Optimized** for all devices
- **Captions** on hover (optional)

---

## 🧪 Testing Checklist

- [ ] Upload 1 image → Success
- [ ] Upload 10 images → Success
- [ ] Upload 11 images → Error (max 10)
- [ ] Upload .txt file → Error (invalid type)
- [ ] Upload 15MB file → Error (max 10MB)
- [ ] Drag image to new position → Saves order
- [ ] Set featured image → Purple badge appears
- [ ] Delete image → Removed from grid
- [ ] Delete featured image → New featured auto-selected
- [ ] View on public booking page → Images display

---

## 🔧 Troubleshooting

### Images not uploading?

**Check:**
```bash
# 1. AWS credentials
echo $AWS_ACCESS_KEY_ID

# 2. S3 bucket exists
aws s3 ls s3://rentflow-uploads

# 3. Bucket policy allows PutObject
aws s3api get-bucket-policy --bucket rentflow-uploads

# 4. Server logs
tail -f backend/logs/error.log
```

### Images not displaying?

**Check:**
```bash
# 1. Image URL works
curl -I https://rentflow-uploads.s3.us-east-1.amazonaws.com/properties/.../image.jpg

# 2. CORS configured
aws s3api get-bucket-cors --bucket rentflow-uploads

# 3. Browser console for errors
# Open DevTools → Console
```

### Drag-and-drop not working?

**Check:**
1. SortableJS library loaded (view page source)
2. JavaScript console for errors
3. Browser supports drag events (all modern browsers do)

---

## 📚 Documentation

- **Technical Guide:** `/docs/IMAGE_MANAGEMENT_GUIDE.md`
- **S3 Strategy:** `/docs/S3_SYNC_STRATEGY.md`
- **Quick Start:** This file

---

## 🎉 You're All Set!

Your property managers can now:

✅ Upload beautiful property photos
✅ Arrange them in perfect order
✅ Set the best cover photo
✅ Delete unwanted images

All without touching code or AWS Console!

---

**Questions?** Check the full documentation in `/docs/IMAGE_MANAGEMENT_GUIDE.md`

**Last Updated:** 2025-10-18
