const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const { User } = require('../models')

/**
 * Configure Passport.js Google OAuth 2.0 Strategy
 *
 * This strategy authenticates users using their Google account
 * and creates or retrieves a user record in the database.
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      passReqToCallback: true
    },
    async function(req, accessToken, refreshToken, profile, done) {
      try {
        console.log('📝 Google OAuth callback received for:', profile.emails[0].value)

        // Find or create user based on Google ID
        let user = await User.findOne({ where: { googleId: profile.id } })

        if (!user) {
          // Check if email already exists (user registered with email/password)
          const existingUser = await User.findOne({
            where: { email: profile.emails[0].value }
          })

          if (existingUser) {
            // Link Google account to existing user
            console.log('🔗 Linking Google account to existing user')
            user = await existingUser.update({
              googleId: profile.id,
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
              emailVerified: true
            })
          } else {
            // Create new user
            console.log('✨ Creating new user from Google profile')
            user = await User.create({
              googleId: profile.id,
              email: profile.emails[0].value,
              firstName: profile.name.givenName || '',
              lastName: profile.name.familyName || '',
              avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
              emailVerified: true,
              isActive: true,
              role: 'owner' // Default role for new users
            })
          }
        } else {
          // Update avatar if changed
          if (profile.photos && profile.photos[0] && profile.photos[0].value !== user.avatar) {
            console.log('🖼️  Updating user avatar')
            await user.update({ avatar: profile.photos[0].value })
          }
        }

        console.log('✅ Google OAuth successful for user:', user.id)

        // Pass the user and profile to the callback handler
        return done(null, { user, profile })
      } catch (error) {
        console.error('❌ Google OAuth error:', error)
        return done(error, null)
      }
    }
  )
)

// Serialize user for session (not used with JWT, but required by Passport)
passport.serializeUser(function(user, done) {
  done(null, user.id)
})

// Deserialize user from session (not used with JWT, but required by Passport)
passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findByPk(id)
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

module.exports = passport
