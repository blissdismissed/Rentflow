/**
 * Frontend Configuration
 * This file contains environment-specific settings for the frontend
 *
 * DEPLOYMENT INSTRUCTIONS:
 * - For local development: Use localhost URL
 * - For S3 production: Replace API_BASE_URL with your EC2 public IP or domain
 */

const CONFIG = {
  // API Configuration
  API_BASE_URL: 'http://localhost:5000',  // Change to 'http://your-ec2-ip' or 'https://yourdomain.com' for production

  // Environment
  ENV: 'development',  // Change to 'production' when deploying to S3

  // Feature flags
  ENABLE_ANALYTICS: false,
  ENABLE_DEBUG: true,  // Set to false in production
}

// Production configuration (uncomment and update when deploying to S3)
/*
const CONFIG = {
  API_BASE_URL: 'http://YOUR_EC2_PUBLIC_IP',  // Or https://api.yourdomain.com
  ENV: 'production',
  ENABLE_ANALYTICS: true,
  ENABLE_DEBUG: false,
}
*/

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
