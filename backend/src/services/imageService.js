const AWS = require('aws-sdk');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

/**
 * Image Service
 * Handles image upload, optimization, and S3 storage for property images
 */
class ImageService {
  constructor() {
    // Initialize S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.bucket = process.env.AWS_S3_BUCKET || 'rentflow-uploads';
    this.cdnUrl = process.env.AWS_CLOUDFRONT_URL; // Optional CloudFront CDN
  }

  /**
   * Upload and optimize property image
   * @param {Buffer} fileBuffer - Image file buffer
   * @param {string} propertyId - Property UUID
   * @param {string} originalName - Original filename
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Uploaded image metadata
   */
  async uploadPropertyImage(fileBuffer, propertyId, originalName, options = {}) {
    try {
      const {
        isFeatured = false,
        caption = '',
        maxWidth = 1920,
        quality = 85
      } = options;

      // Generate unique filename
      const imageId = uuidv4();
      const ext = originalName.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const filename = `${imageId}-${timestamp}.${ext}`;
      const s3Key = `properties/${propertyId}/images/${filename}`;

      // Optimize image using Sharp
      const optimizedBuffer = await this.optimizeImage(fileBuffer, {
        maxWidth,
        quality,
        format: ext
      });

      // Generate thumbnail
      const thumbnailBuffer = await this.generateThumbnail(fileBuffer);
      const thumbnailKey = `properties/${propertyId}/thumbnails/${filename}`;

      // Upload original optimized image
      const uploadParams = {
        Bucket: this.bucket,
        Key: s3Key,
        Body: optimizedBuffer,
        ContentType: this.getContentType(ext),
        ACL: 'public-read',
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
          propertyId,
          imageId,
          originalName,
          uploadedAt: new Date().toISOString()
        }
      };

      await this.s3.upload(uploadParams).promise();

      // Upload thumbnail
      const thumbnailParams = {
        Bucket: this.bucket,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: this.getContentType(ext),
        ACL: 'public-read',
        CacheControl: 'max-age=31536000'
      };

      await this.s3.upload(thumbnailParams).promise();

      // Get image metadata
      const metadata = await sharp(optimizedBuffer).metadata();

      // Construct URLs
      const imageUrl = this.getImageUrl(s3Key);
      const thumbnailUrl = this.getImageUrl(thumbnailKey);

      return {
        id: imageId,
        url: imageUrl,
        thumbnailUrl,
        key: s3Key,
        thumbnailKey,
        originalName,
        caption,
        isFeatured,
        width: metadata.width,
        height: metadata.height,
        size: optimizedBuffer.length,
        format: metadata.format,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Optimize image for web
   * @param {Buffer} buffer - Image buffer
   * @param {Object} options - Optimization options
   * @returns {Promise<Buffer>} Optimized image buffer
   */
  async optimizeImage(buffer, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1280,
      quality = 85,
      format = 'jpeg'
    } = options;

    let pipeline = sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

    // Apply format-specific optimization
    if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({
        quality,
        progressive: true,
        mozjpeg: true
      });
    } else if (format === 'png') {
      pipeline = pipeline.png({
        quality,
        compressionLevel: 9,
        progressive: true
      });
    } else if (format === 'webp') {
      pipeline = pipeline.webp({
        quality
      });
    }

    return pipeline.toBuffer();
  }

  /**
   * Generate thumbnail
   * @param {Buffer} buffer - Original image buffer
   * @returns {Promise<Buffer>} Thumbnail buffer
   */
  async generateThumbnail(buffer) {
    return sharp(buffer)
      .resize(400, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer();
  }

  /**
   * Delete image from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<void>}
   */
  async deleteImage(s3Key) {
    try {
      const deleteParams = {
        Bucket: this.bucket,
        Key: s3Key
      };

      await this.s3.deleteObject(deleteParams).promise();

      // Also delete thumbnail if exists
      const thumbnailKey = s3Key.replace('/images/', '/thumbnails/');
      try {
        await this.s3.deleteObject({
          Bucket: this.bucket,
          Key: thumbnailKey
        }).promise();
      } catch (err) {
        // Thumbnail might not exist, ignore error
        console.log('Thumbnail not found or already deleted');
      }

      console.log(`Image deleted from S3: ${s3Key}`);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   * @param {Array<string>} s3Keys - Array of S3 keys to delete
   * @returns {Promise<void>}
   */
  async deleteMultipleImages(s3Keys) {
    if (!s3Keys || s3Keys.length === 0) return;

    // Include thumbnails
    const allKeys = s3Keys.flatMap(key => [
      key,
      key.replace('/images/', '/thumbnails/')
    ]);

    const deleteParams = {
      Bucket: this.bucket,
      Delete: {
        Objects: allKeys.map(Key => ({ Key })),
        Quiet: false
      }
    };

    try {
      const result = await this.s3.deleteObjects(deleteParams).promise();
      console.log(`Deleted ${result.Deleted?.length || 0} images from S3`);
    } catch (error) {
      console.error('Error deleting multiple images:', error);
      throw new Error(`Failed to delete images: ${error.message}`);
    }
  }

  /**
   * Get presigned URL for direct upload (alternative method)
   * @param {string} propertyId - Property UUID
   * @param {string} filename - Filename
   * @param {string} contentType - MIME type
   * @returns {Promise<Object>} Presigned URL and metadata
   */
  async getPresignedUploadUrl(propertyId, filename, contentType) {
    const imageId = uuidv4();
    const ext = filename.split('.').pop();
    const timestamp = Date.now();
    const s3Key = `properties/${propertyId}/images/${imageId}-${timestamp}.${ext}`;

    const params = {
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: contentType,
      ACL: 'public-read',
      Expires: 300 // 5 minutes
    };

    const presignedUrl = await this.s3.getSignedUrlPromise('putObject', params);

    return {
      uploadUrl: presignedUrl,
      imageId,
      key: s3Key,
      publicUrl: this.getImageUrl(s3Key)
    };
  }

  /**
   * Get public URL for S3 object
   * @param {string} s3Key - S3 object key
   * @returns {string} Public URL
   */
  getImageUrl(s3Key) {
    // Use CloudFront CDN if configured
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${s3Key}`;
    }

    // Otherwise use S3 direct URL
    return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
  }

  /**
   * Get content type from file extension
   * @param {string} ext - File extension
   * @returns {string} MIME type
   */
  getContentType(ext) {
    const types = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp'
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Validate image file
   * @param {Object} file - Multer file object
   * @returns {boolean} Is valid
   */
  validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    return true;
  }

  /**
   * Convert image URL to S3 key
   * @param {string} url - Image URL
   * @returns {string} S3 key
   */
  urlToKey(url) {
    // Extract key from S3 URL or CloudFront URL
    if (url.includes('s3.amazonaws.com')) {
      return url.split('.com/')[1];
    }
    if (this.cdnUrl && url.startsWith(this.cdnUrl)) {
      return url.replace(`${this.cdnUrl}/`, '');
    }
    return url;
  }

  /**
   * Reorder images (updates order metadata)
   * @param {Array<Object>} images - Array of images with new order
   * @returns {Array<Object>} Reordered images with updated order field
   */
  reorderImages(images) {
    return images.map((img, index) => ({
      ...img,
      order: index
    }));
  }
}

module.exports = new ImageService();
