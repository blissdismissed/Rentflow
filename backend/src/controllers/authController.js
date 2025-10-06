const { User } = require('../models')
const { generateToken, generateRefreshToken } = require('../middleware/auth')
const { v4: uuidv4 } = require('uuid')

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber
    })

    // Generate tokens
    const token = generateToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check password
    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive'
      })
    }

    // Update last login
    await user.update({ lastLogin: new Date() })

    // Generate tokens
    const token = generateToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    })
  }
}

const googleCallback = async (req, res) => {
  try {
    const { profile } = req.user

    // Find or create user
    let user = await User.findOne({ where: { googleId: profile.id } })

    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        avatar: profile.photos[0]?.value,
        emailVerified: true
      })
    }

    // Update last login
    await user.update({ lastLogin: new Date() })

    // Generate tokens
    const token = generateToken(user.id)
    const refreshToken = generateRefreshToken(user.id)

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8000'
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&refreshToken=${refreshToken}`)
  } catch (error) {
    console.error('Google OAuth error:', error)
    res.status(500).json({
      success: false,
      message: 'Error with Google authentication',
      error: error.message
    })
  }
}

const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      })
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findByPk(decoded.id)

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }

    const newToken = generateToken(user.id)
    const newRefreshToken = generateRefreshToken(user.id)

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    })
  }
}

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          association: 'properties',
          attributes: ['id', 'name', 'status']
        }
      ]
    })

    res.json({
      success: true,
      data: { user: user.toJSON() }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body

    await req.user.update({
      firstName: firstName || req.user.firstName,
      lastName: lastName || req.user.lastName,
      phoneNumber: phoneNumber || req.user.phoneNumber
    })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: req.user.toJSON() }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    })
  }
}

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const isValidPassword = await req.user.validatePassword(currentPassword)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    await req.user.update({ password: newPassword })

    res.json({
      success: true,
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    })
  }
}

module.exports = {
  register,
  login,
  googleCallback,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  changePassword
}
