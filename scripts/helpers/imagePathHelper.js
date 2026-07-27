/**
 * Helper functions for generating S3 image paths
 * This ensures consistent, organized image storage
 */

const BASE_URL = 'https://aspiretowards.com/assets'

/**
 * Generate property image paths based on property ID
 * @param {string} propertyId - UUID of the property
 * @param {string[]} imageFiles - Array of image filenames
 * @returns {object} - Object with featuredImage and images array
 */
function generatePropertyImagePaths(propertyId, imageFiles) {
  const propertyPath = `${BASE_URL}/properties/${propertyId}`

  return {
    featuredImage: `${propertyPath}/${imageFiles[0]}`,
    images: imageFiles.map(file => `${propertyPath}/${file}`)
  }
}

/**
 * Generate user avatar path
 * @param {string} userId - UUID of the user
 * @param {string} filename - Avatar filename
 * @returns {string} - Full S3 URL
 */
function generateUserAvatarPath(userId, filename = 'avatar.jpg') {
  return `${BASE_URL}/users/${userId}/${filename}`
}

/**
 * Extract property ID from image URL
 * @param {string} imageUrl - Full image URL
 * @returns {string|null} - Property ID or null
 */
function extractPropertyIdFromUrl(imageUrl) {
  const match = imageUrl.match(/\/properties\/([a-f0-9-]{36})\//)
  return match ? match[1] : null
}

/**
 * Generate booking document path
 * @param {string} bookingId - UUID of the booking
 * @param {string} filename - Document filename
 * @returns {string} - Full S3 URL
 */
function generateBookingDocumentPath(bookingId, filename) {
  return `${BASE_URL}/bookings/${bookingId}/${filename}`
}

module.exports = {
  generatePropertyImagePaths,
  generateUserAvatarPath,
  extractPropertyIdFromUrl,
  generateBookingDocumentPath,
  BASE_URL
}
