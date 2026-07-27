const { PropertySettings, Property } = require('../models')

/**
 * Property Settings Controller
 * Handles property-level settings for emails, PINs, etc.
 */
class PropertySettingsController {
  /**
   * Get property settings
   * @route GET /api/properties/:propertyId/settings
   */
  async getSettings(req, res) {
    try {
      const { propertyId } = req.params
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      // Get or create settings
      let settings = await PropertySettings.findOne({
        where: { propertyId }
      })

      if (!settings) {
        settings = await PropertySettings.create({ propertyId })
      }

      res.json({
        success: true,
        settings
      })
    } catch (error) {
      console.error('Error fetching property settings:', error)
      res.status(500).json({
        success: false,
        message: 'Error fetching settings',
        error: error.message
      })
    }
  }

  /**
   * Update property settings
   * @route PUT /api/properties/:propertyId/settings
   */
  async updateSettings(req, res) {
    try {
      const { propertyId } = req.params
      const userId = req.user.id
      const {
        rotatingPinsEnabled,
        preStayEmailEnabled,
        preStayEmailDays,
        postStayEmailEnabled,
        postStayEmailDays,
        checkInInstructions,
        wifiNetwork,
        wifiPassword,
        parkingInstructions,
        houseRules
      } = req.body

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      // Get or create settings
      let settings = await PropertySettings.findOne({
        where: { propertyId }
      })

      if (!settings) {
        settings = await PropertySettings.create({ propertyId })
      }

      // Update fields
      if (rotatingPinsEnabled !== undefined) settings.rotatingPinsEnabled = rotatingPinsEnabled
      if (preStayEmailEnabled !== undefined) settings.preStayEmailEnabled = preStayEmailEnabled
      if (preStayEmailDays !== undefined) settings.preStayEmailDays = preStayEmailDays
      if (postStayEmailEnabled !== undefined) settings.postStayEmailEnabled = postStayEmailEnabled
      if (postStayEmailDays !== undefined) settings.postStayEmailDays = postStayEmailDays
      if (checkInInstructions !== undefined) settings.checkInInstructions = checkInInstructions
      if (wifiNetwork !== undefined) settings.wifiNetwork = wifiNetwork
      if (wifiPassword !== undefined) settings.wifiPassword = wifiPassword
      if (parkingInstructions !== undefined) settings.parkingInstructions = parkingInstructions
      if (houseRules !== undefined) settings.houseRules = houseRules

      await settings.save()

      res.json({
        success: true,
        message: 'Settings updated successfully',
        settings
      })
    } catch (error) {
      console.error('Error updating property settings:', error)
      res.status(500).json({
        success: false,
        message: 'Error updating settings',
        error: error.message
      })
    }
  }

  /**
   * Toggle rotating PINs feature
   * @route POST /api/properties/:propertyId/settings/toggle-pins
   */
  async toggleRotatingPins(req, res) {
    try {
      const { propertyId } = req.params
      const { enabled } = req.body
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      // Get or create settings
      let settings = await PropertySettings.findOne({
        where: { propertyId }
      })

      if (!settings) {
        settings = await PropertySettings.create({ propertyId })
      }

      settings.rotatingPinsEnabled = enabled

      // Reset rotation index when disabling
      if (!enabled) {
        settings.currentPinIndex = 0
      }

      await settings.save()

      res.json({
        success: true,
        message: `Rotating PINs ${enabled ? 'enabled' : 'disabled'} successfully`,
        rotatingPinsEnabled: settings.rotatingPinsEnabled
      })
    } catch (error) {
      console.error('Error toggling rotating PINs:', error)
      res.status(500).json({
        success: false,
        message: 'Error toggling rotating PINs',
        error: error.message
      })
    }
  }
}

module.exports = new PropertySettingsController()
