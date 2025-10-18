const multer = require('multer');

/**
 * Multer configuration for image uploads
 * Uses memory storage to process images before uploading to S3
 */

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: fileFilter
});

module.exports = {
  // Upload single image
  single: upload.single('image'),

  // Upload multiple images (up to 10)
  multiple: upload.array('images', 10),

  // Upload with field names
  fields: upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ])
};
