/**
 * Frontend Configuration
 * This file contains environment-specific settings for the frontend
 *
 * DEPLOYMENT INSTRUCTIONS:
 * - For local development: Use localhost URL
 * - For S3 production: Replace API_BASE_URL with your EC2 public IP or domain
 */

// Development config
/*
const CONFIG = {
  // API Configuration
  API_BASE_URL: 'http://localhost:5000',  // Change to 'http://your-ec2-ip' or 'https://yourdomain.com' for production

  // Environment
  ENV: 'development',  // Change to 'production' when deploying to S3

  // Feature flags
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG: true,  // Set to false in production
}
*/

// Production configuration
const CONFIG = {
  API_BASE_URL: 'https://api.aspiretowards.com',
  ENV: 'production',
  ENABLE_ANALYTICS: true,
  ENABLE_DEBUG: false,

  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: 'pk_test_51SJcTTRof35cBGM2T9MlBeLRq3W6AJSaFPx4NjWYuG04K1wznZmAa87XZOLm4dutCrzlFgmptPsfbVK2cE67hFET00bbrf6xXD',
}


// Make config available globally
window.CONFIG = CONFIG

// Helper function to build API URLs
window.apiUrl = (endpoint) => {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${CONFIG.API_BASE_URL}${path}`
}

// Log configuration in development
if (CONFIG.ENABLE_DEBUG) {
  console.log('🔧 App Configuration:', CONFIG)
}
