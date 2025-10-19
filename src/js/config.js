/**
 * Frontend Configuration for Host Dashboard
 * This file contains environment-specific settings
 */

// Development config
/*
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000',
  ENV: 'development',
  ENABLE_DEBUG: true
}
*/

// Production configuration
const CONFIG = {
  API_BASE_URL: 'https://api.aspiretowards.com',
  ENV: 'production',
  ENABLE_DEBUG: false,

  // Stripe Publishable Key (safe to expose in frontend)
  // Get from: https://dashboard.stripe.com/test/apikeys
  STRIPE_PUBLISHABLE_KEY: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE'
}

// Make config available globally
window.CONFIG = CONFIG

// Helper function to build API URLs
window.apiUrl = function(endpoint) {
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint
  return CONFIG.API_BASE_URL + path
}

// Log configuration in development
if (CONFIG.ENABLE_DEBUG) {
  console.log('🔧 App Configuration:', CONFIG)
}
