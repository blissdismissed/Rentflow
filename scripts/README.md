# Property Management Scripts

## Image Organization System

All images are organized by **UUID** to prevent conflicts and ensure scalability.

### Directory Structure on S3

```
/assets/
├── properties/
│   ├── {property-uuid-1}/
│   │   ├── main.jpg
│   │   ├── living-room.jpg
│   │   ├── bedroom.jpg
│   │   └── kitchen.jpg
│   └── {property-uuid-2}/
│       └── ...
├── users/
│   └── {user-uuid}/
│       └── avatar.jpg
└── bookings/
    └── {booking-uuid}/
        └── documents/
```

## Creating a Property

### Step 1: Run the creation script

```bash
# From project root
node scripts/create-test-property.js your@email.com
```

The script will output:
- Property ID (UUID)
- User ID (UUID)
- S3 upload path

### Step 2: Upload images to S3

Upload your property images to the S3 path shown:

```
/assets/properties/{property-id}/
  ├── main.jpg          (Required - main hero image)
  ├── living-room.jpg   (Optional - additional images)
  ├── bedroom.jpg       (Optional)
  └── kitchen.jpg       (Optional)
```

**Important:**
- Make images publicly readable
- Recommended dimensions: 1200x800px for main, 800x600px for others
- Use JPG format for best compatibility

### Step 3: Verify

Visit your property page:
```
https://aspiretowards.com/property.html?slug=bromley-mountain-ski-condo
```

## Image Path Helper

The `helpers/imagePathHelper.js` module provides utilities for generating consistent S3 paths:

```javascript
const { generatePropertyImagePaths } = require('./helpers/imagePathHelper')

// Generate paths for a property
const imageFiles = ['main.jpg', 'living-room.jpg', 'bedroom.jpg']
const paths = generatePropertyImagePaths(propertyId, imageFiles)

// Returns:
// {
//   featuredImage: 'https://aspiretowards.com/assets/properties/{id}/main.jpg',
//   images: [
//     'https://aspiretowards.com/assets/properties/{id}/main.jpg',
//     'https://aspiretowards.com/assets/properties/{id}/living-room.jpg',
//     'https://aspiretowards.com/assets/properties/{id}/bedroom.jpg'
//   ]
// }
```

## Benefits of UUID-based Organization

✅ **No naming conflicts** - Each property has unique folder
✅ **Scalable** - Add unlimited properties without path collisions
✅ **Secure** - Property IDs are not sequential or guessable
✅ **Flexible** - Easy to add/remove images without affecting others
✅ **Traceable** - Direct mapping between DB records and S3 files

## Existing Property IDs

To find your property's ID:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Connect to PostgreSQL
psql -U at_user -d rentflow_db

# List properties with IDs
SELECT id, name, slug FROM properties;
```

Or check the dashboard when logged in - it will show property IDs in the console logs.
