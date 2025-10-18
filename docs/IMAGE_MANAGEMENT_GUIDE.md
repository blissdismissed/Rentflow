# Image Management System - Complete Implementation Guide

## Overview

This document describes the complete image management system for the RentFlow property management platform, including uploading, deleting, reordering, and managing property images.

---

## Features Implemented

### ✅ Backend (API)

1. **Image Upload** - POST `/api/properties/:id/images`
   - Multiple file upload (up to 10 images)
   - Automatic image optimization using Sharp
   - Thumbnail generation (400x300px)
   - S3 storage with public-read ACL
   - Metadata tracking (size, dimensions, format)

2. **Image Deletion** - DELETE `/api/properties/:id/images/:imageId`
   - Removes image from S3
   - Deletes both full-size and thumbnail
   - Updates property database record
   - Auto-selects new featured image if needed

3. **Image Reordering** - PUT `/api/properties/:id/images/reorder`
   - Accepts array of image IDs in new order
   - Updates order field for each image
   - Preserves images not in reorder array

4. **Set Featured Image** - PUT `/api/properties/:id/images/:imageId/featured`
   - Sets specific image as cover photo
   - Updates `featuredImage` field
   - Marks image with `isFeatured` flag

5. **Update Caption** - PUT `/api/properties/:id/images/:imageId/caption`
   - Adds/updates descriptive text for images
   - Displayed on image hover

### ✅ Frontend (Dashboard)

1. **Property Edit Page** - `/src/pages/dashboard/property-edit.html`
   - Tabbed interface (Images, Details, Pricing)
   - Drag-and-drop upload zone
   - File input fallback
   - Progress bar for uploads
   - Image grid with thumbnails

2. **Drag-and-Drop Reordering**
   - Uses SortableJS library
   - Visual feedback during drag
   - Auto-saves new order on drop
   - Ghost preview while dragging

3. **Image Actions**
   - Set as cover photo
   - Edit caption
   - Delete image
   - Confirm dialogs for destructive actions

4. **Responsive Design**
   - Mobile-friendly grid layout
   - Touch-friendly drag gestures
   - Adaptive image sizing

### ✅ Image Processing

1. **Optimization**
   - Resize to max 1920px wide
   - JPEG quality: 85%
   - Progressive JPEG encoding
   - WebP support

2. **Thumbnails**
   - 400x300px cover crop
   - 80% JPEG quality
   - Fast loading for galleries

3. **Validation**
   - File type: JPEG, PNG, WebP only
   - Max size: 10MB per image
   - Max files: 10 per upload

---

## Architecture

### Database Schema

**Property Model** (`properties` table):
```javascript
{
  id: UUID,
  userId: UUID,
  name: STRING,
  // ... other fields

  // Image fields
  featuredImage: TEXT,  // URL of cover photo
  images: JSONB         // Array of image objects
}
```

**Image Object Structure** (in `images` JSONB array):
```javascript
{
  id: "uuid-v4",
  url: "https://bucket.s3.region.amazonaws.com/properties/{propertyId}/images/{filename}",
  thumbnailUrl: "https://bucket.s3.region.amazonaws.com/properties/{propertyId}/thumbnails/{filename}",
  key: "properties/{propertyId}/images/{filename}",
  thumbnailKey: "properties/{propertyId}/thumbnails/{filename}",
  originalName: "IMG_1234.jpg",
  caption: "Beautiful living room",
  isFeatured: false,
  width: 1920,
  height: 1080,
  size: 245678,  // bytes
  format: "jpeg",
  order: 0,
  uploadedAt: "2025-10-18T12:00:00.000Z"
}
```

### S3 File Structure

```
rentflow-uploads/
└── properties/
    └── {property-uuid}/
        ├── images/
        │   ├── {image-uuid-1}-1697654400000.jpg
        │   ├── {image-uuid-2}-1697654401000.jpg
        │   └── ...
        └── thumbnails/
            ├── {image-uuid-1}-1697654400000.jpg
            ├── {image-uuid-2}-1697654401000.jpg
            └── ...
```

### API Endpoints

```
Authentication Required (Bearer Token)

POST   /api/properties/:id/images
       Upload multiple images (multipart/form-data)
       Field name: "images" (array)
       Max files: 10
       Returns: { success, message, data: { uploadedImages, property } }

DELETE /api/properties/:id/images/:imageId
       Delete single image
       Returns: { success, message, data: { property } }

PUT    /api/properties/:id/images/reorder
       Reorder images
       Body: { imageOrder: ["uuid1", "uuid2", ...] }
       Returns: { success, message, data: { property } }

PUT    /api/properties/:id/images/:imageId/featured
       Set as cover photo
       Returns: { success, message, data: { property } }

PUT    /api/properties/:id/images/:imageId/caption
       Update image caption
       Body: { caption: "..." }
       Returns: { success, message, data: { property } }
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install sharp multer
```

Dependencies added:
- `sharp` - Image processing and optimization
- `multer` - Multipart form data handling (already installed)

### 2. Configure AWS S3

Update `.env`:
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=rentflow-uploads

# Optional: CloudFront CDN
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

Create S3 bucket:
```bash
aws s3 mb s3://rentflow-uploads --region us-east-1
```

Set bucket policy (public read):
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
    }
  ]
}
```

Configure CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "http://localhost:8000",
      "https://aspiretowards.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Backend Files Created

```
/backend/src/
├── services/
│   └── imageService.js          (NEW) - S3 upload, optimization, deletion
├── middleware/
│   └── upload.js                (NEW) - Multer configuration
├── controllers/
│   └── propertyController.js    (UPDATED) - Image management endpoints
└── routes/
    └── propertyRoutes.js        (UPDATED) - Image routes + multer middleware
```

### 4. Frontend Files Created

```
/src/pages/dashboard/
├── property-edit.html           (NEW) - Image management UI
└── property-edit.js             (NEW) - Image management logic
```

### 5. Documentation Created

```
/docs/
├── IMAGE_MANAGEMENT_GUIDE.md    (THIS FILE)
└── S3_SYNC_STRATEGY.md          (NEW) - S3 deployment best practices
```

---

## Usage Guide

### For Developers

#### Upload Images Programmatically

```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);

const response = await fetch(`${API_URL}/api/properties/${propertyId}/images`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
console.log(data.data.uploadedImages); // Array of uploaded image objects
```

#### Delete Image

```javascript
await fetch(`${API_URL}/api/properties/${propertyId}/images/${imageId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Reorder Images

```javascript
const newOrder = ['uuid1', 'uuid2', 'uuid3'];

await fetch(`${API_URL}/api/properties/${propertyId}/images/reorder`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ imageOrder: newOrder })
});
```

#### Set Featured Image

```javascript
await fetch(`${API_URL}/api/properties/${propertyId}/images/${imageId}/featured`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### For Property Managers (End Users)

1. **Navigate to Property Edit Page:**
   - Go to dashboard → Properties
   - Click "Edit" button on a property
   - Or visit: `/src/pages/dashboard/property-edit.html?id={propertyId}`

2. **Upload Images:**
   - Click upload zone or drag & drop files
   - Select up to 10 images (JPEG, PNG, or WebP)
   - Wait for upload to complete
   - Images appear in grid automatically

3. **Reorder Images:**
   - Click and drag any image to new position
   - Release to save new order
   - First image is automatically the cover photo

4. **Set Cover Photo:**
   - Click "Actions" button on desired image
   - Select "Set as Cover Photo"
   - Purple badge indicates featured image

5. **Add Caption:**
   - Click "Actions" button on image
   - Select "Edit Caption"
   - Enter descriptive text
   - Caption appears on hover

6. **Delete Image:**
   - Click "Actions" button on image
   - Select "Delete Image"
   - Confirm deletion
   - Image removed from S3 and database

---

## Frontend Integration

### Using Images in Public Booking Pages

The direct booking page automatically uses the optimized images:

```javascript
// Get property with images
const response = await fetch(`${API_URL}/api/public/properties/${slug}`);
const { property } = response.data;

// Featured/cover image
const coverImage = property.featuredImage;

// All images
const allImages = property.images || [];

// Display in gallery
allImages.forEach(img => {
  const imgElement = document.createElement('img');
  imgElement.src = img.thumbnailUrl || img.url; // Use thumbnail for thumbnails
  imgElement.alt = img.caption || property.name;
  gallery.appendChild(imgElement);
});
```

### Image Grid with Lightbox

```html
<div class="image-gallery">
  <!-- Main image -->
  <div class="main-image">
    <img src="${property.featuredImage}" alt="${property.name}">
  </div>

  <!-- Thumbnail grid -->
  <div class="thumbnail-grid">
    ${property.images.map(img => `
      <img src="${img.thumbnailUrl}"
           alt="${img.caption}"
           onclick="openLightbox('${img.url}')">
    `).join('')}
  </div>
</div>
```

---

## Performance Optimization

### Image Optimization

- **Original images** are resized to max 1920px width
- **Thumbnails** are cropped to 400x300px
- **Progressive JPEG** encoding for faster perceived loading
- **WebP support** for modern browsers (future enhancement)

### CDN Integration

Enable CloudFront for faster global delivery:

1. Create CloudFront distribution pointing to S3 bucket
2. Update `.env`:
   ```
   AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
   ```
3. Image URLs automatically use CDN

### Caching

S3 objects have `Cache-Control: max-age=31536000` (1 year) because filenames include timestamps.

---

## Security Considerations

### Access Control

- **Upload**: Requires authentication (JWT token)
- **Delete**: Requires authentication + property ownership verification
- **Read**: Public access for property images only

### File Validation

- **Type checking**: Only JPEG, PNG, WebP allowed
- **Size limit**: 10MB per file
- **Malware scanning**: Consider adding ClamAV integration (future)

### S3 Security

- **Bucket policy**: Public read, API-only write
- **IAM user**: Dedicated user with minimal permissions
- **Encryption**: Enable S3 bucket encryption (optional)

---

## Troubleshooting

### Images Not Uploading

**Check:**
1. AWS credentials in `.env` are correct
2. S3 bucket exists and is accessible
3. Bucket policy allows `s3:PutObject`
4. CORS configuration includes your domain
5. File size under 10MB
6. File type is JPEG/PNG/WebP

**Debug:**
```javascript
// Enable verbose logging in imageService.js
console.log('Uploading to S3:', {
  bucket: this.bucket,
  key: s3Key,
  fileSize: optimizedBuffer.length
});
```

### Images Not Displaying

**Check:**
1. Image URLs in database are correct
2. S3 bucket policy allows public read
3. CORS headers include your origin
4. CloudFront distribution is deployed (if using)

**Test:**
```bash
# Test S3 URL directly
curl -I https://rentflow-uploads.s3.us-east-1.amazonaws.com/properties/{uuid}/images/{filename}
# Should return 200 OK
```

### Drag-and-Drop Not Working

**Check:**
1. SortableJS library is loaded
2. JavaScript console for errors
3. Browser supports drag events
4. Elements have correct `data-image-id` attributes

### S3 Sync Deleting Images

**Solution:** Use separate buckets or exclusions. See `/docs/S3_SYNC_STRATEGY.md`

```bash
# ❌ DON'T:
aws s3 sync . s3://aspiretowards.com/ --delete

# ✅ DO:
aws s3 sync . s3://aspiretowards.com/ --delete --exclude "properties/*"
```

---

## Future Enhancements

### Planned Features

1. **Bulk Upload**
   - Zip file upload
   - Automatic extraction and processing

2. **Image Cropping**
   - In-browser crop tool
   - Aspect ratio presets

3. **Image Filters**
   - Brightness/contrast adjustment
   - Filters (sepia, black & white, etc.)

4. **Advanced Reordering**
   - Keyboard shortcuts
   - Grid view vs. list view
   - Batch operations

5. **AI-Powered Features**
   - Auto-caption generation
   - Object detection (bedroom, kitchen, etc.)
   - Quality scoring

6. **WebP Conversion**
   - Serve WebP to supported browsers
   - Automatic fallback to JPEG

7. **Image Analytics**
   - View counts per image
   - Click-through rates
   - A/B testing for cover photos

---

## API Reference

### Image Upload Response

```json
{
  "success": true,
  "message": "Successfully uploaded 3 image(s)",
  "data": {
    "uploadedImages": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "url": "https://rentflow-uploads.s3.us-east-1.amazonaws.com/properties/123/images/550e8400-1697654400000.jpg",
        "thumbnailUrl": "https://rentflow-uploads.s3.us-east-1.amazonaws.com/properties/123/thumbnails/550e8400-1697654400000.jpg",
        "key": "properties/123/images/550e8400-1697654400000.jpg",
        "thumbnailKey": "properties/123/thumbnails/550e8400-1697654400000.jpg",
        "originalName": "living-room.jpg",
        "caption": "",
        "isFeatured": false,
        "width": 1920,
        "height": 1080,
        "size": 245678,
        "format": "jpeg",
        "uploadedAt": "2025-10-18T12:00:00.000Z"
      }
    ],
    "property": { /* full property object */ }
  }
}
```

### Error Responses

```json
{
  "success": false,
  "message": "No images provided",
  "error": "..."
}
```

Common error messages:
- `"No images provided"` - No files in request
- `"Property not found"` - Invalid property ID or no access
- `"Image not found"` - Invalid image ID
- `"All image uploads failed"` - All files failed validation
- `"Failed to upload image: ..."` - S3 upload error
- `"Invalid file type. Only JPEG, PNG, and WebP images are allowed."` - File validation error
- `"File too large. Maximum size is 10MB."` - File size error

---

## Testing

### Manual Testing Checklist

- [ ] Upload single image
- [ ] Upload multiple images (10)
- [ ] Upload exceeding limit (11 images)
- [ ] Upload invalid file type (.txt, .pdf)
- [ ] Upload oversized file (>10MB)
- [ ] Drag and drop upload
- [ ] Reorder images via drag
- [ ] Set featured image
- [ ] Edit caption
- [ ] Delete image
- [ ] Delete last image (featured)
- [ ] View images on public booking page

### Automated Testing

```javascript
// Example Jest test
describe('Image Service', () => {
  it('should optimize image', async () => {
    const buffer = fs.readFileSync('test-image.jpg');
    const optimized = await imageService.optimizeImage(buffer, {
      maxWidth: 1920,
      quality: 85
    });

    expect(optimized).toBeDefined();
    expect(optimized.length).toBeLessThan(buffer.length);
  });

  it('should generate thumbnail', async () => {
    const buffer = fs.readFileSync('test-image.jpg');
    const thumbnail = await imageService.generateThumbnail(buffer);

    const metadata = await sharp(thumbnail).metadata();
    expect(metadata.width).toBe(400);
    expect(metadata.height).toBe(300);
  });
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] AWS credentials configured
- [ ] S3 bucket created
- [ ] Bucket policy set to public read
- [ ] CORS configured on bucket
- [ ] Environment variables set
- [ ] Dependencies installed (`npm install`)
- [ ] Code tested locally

### Post-Deployment

- [ ] Test upload from production dashboard
- [ ] Verify images display on public site
- [ ] Check S3 bucket for uploaded files
- [ ] Monitor CloudWatch logs for errors
- [ ] Test from different browsers
- [ ] Test on mobile devices

---

**Last Updated:** 2025-10-18
**Version:** 1.0.0
**Authors:** RentFlow Development Team
