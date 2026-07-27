const Integration = require('../models/Integration');
const airbnbService = require('../services/airbnbService');
const crypto = require('crypto');

class IntegrationController {
  /**
   * Get all integrations for the authenticated user
   */
  async getIntegrations(req, res) {
    try {
      const integrations = await Integration.findAll({
        where: { userId: req.user.id },
        attributes: { exclude: ['accessToken', 'refreshToken'] }
      });

      res.json({
        success: true,
        data: integrations
      });
    } catch (error) {
      console.error('Error fetching integrations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch integrations'
      });
    }
  }

  /**
   * Initiate Airbnb OAuth flow
   */
  async connectAirbnb(req, res) {
    try {
      // Generate a state token for CSRF protection
      const state = crypto.randomBytes(32).toString('hex');

      // Store state in session or database for validation
      // For now, we'll encode the userId in the state
      const stateData = Buffer.from(JSON.stringify({
        userId: req.user.id,
        timestamp: Date.now(),
        nonce: state
      })).toString('base64');

      const authUrl = airbnbService.getAuthorizationUrl(req.user.id, stateData);

      res.json({
        success: true,
        data: {
          authUrl,
          state: stateData
        }
      });
    } catch (error) {
      console.error('Error initiating Airbnb connection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Airbnb connection'
      });
    }
  }

  /**
   * Handle Airbnb OAuth callback
   */
  async airbnbCallback(req, res) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code not provided'
        });
      }

      // Decode and validate state
      let stateData;
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid state parameter'
        });
      }

      // Validate state timestamp (prevent replay attacks)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (stateData.timestamp < fiveMinutesAgo) {
        return res.status(400).json({
          success: false,
          message: 'State parameter expired'
        });
      }

      // Exchange code for access token
      const tokens = await airbnbService.getAccessToken(code);

      // Calculate token expiration
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      // Create or update integration
      let integration = await Integration.findOne({
        where: {
          userId: stateData.userId,
          platform: 'airbnb'
        }
      });

      if (integration) {
        await integration.update({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: expiresAt,
          syncEnabled: true,
          syncStatus: 'active',
          isActive: true
        });
      } else {
        integration = await Integration.create({
          userId: stateData.userId,
          platform: 'airbnb',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: expiresAt,
          syncEnabled: true,
          syncStatus: 'active',
          isActive: true
        });
      }

      // Trigger initial sync in background
      this.syncAirbnbData(integration.id).catch(err => {
        console.error('Background sync error:', err);
      });

      // Redirect to frontend with success
      const redirectUrl = `${process.env.FRONTEND_URL}/src/pages/dashboard/properties.html?airbnb=connected`;
      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Error in Airbnb callback:', error);

      const redirectUrl = `${process.env.FRONTEND_URL}/src/pages/dashboard/properties.html?airbnb=error`;
      res.redirect(redirectUrl);
    }
  }

  /**
   * Disconnect Airbnb integration
   */
  async disconnectAirbnb(req, res) {
    try {
      const integration = await Integration.findOne({
        where: {
          userId: req.user.id,
          platform: 'airbnb'
        }
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Airbnb integration not found'
        });
      }

      await integration.update({
        isActive: false,
        syncEnabled: false
      });

      res.json({
        success: true,
        message: 'Airbnb integration disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting Airbnb:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect Airbnb integration'
      });
    }
  }

  /**
   * Manually trigger sync for an integration
   */
  async syncIntegration(req, res) {
    try {
      const { id } = req.params;

      const integration = await Integration.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }

      if (!integration.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Integration is not active'
        });
      }

      // Trigger sync based on platform
      let result;
      switch (integration.platform) {
        case 'airbnb':
          result = await this.syncAirbnbData(integration.id);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported platform'
          });
      }

      res.json({
        success: true,
        message: 'Sync completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error syncing integration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync integration',
        error: error.message
      });
    }
  }

  /**
   * Sync Airbnb listings and reservations
   */
  async syncAirbnbData(integrationId) {
    const integration = await Integration.findByPk(integrationId);

    if (!integration) {
      throw new Error('Integration not found');
    }

    // Sync listings
    const properties = await airbnbService.syncListings(integration);

    // Sync reservations for each property
    const bookings = [];
    for (const property of properties) {
      const propertyBookings = await airbnbService.syncReservations(integration, property.id);
      bookings.push(...propertyBookings);
    }

    return {
      properties: properties.length,
      bookings: bookings.length,
      syncedAt: new Date()
    };
  }

  /**
   * Update integration settings
   */
  async updateIntegration(req, res) {
    try {
      const { id } = req.params;
      const { syncEnabled, config } = req.body;

      const integration = await Integration.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }

      const updateData = {};
      if (typeof syncEnabled !== 'undefined') updateData.syncEnabled = syncEnabled;
      if (config) updateData.config = config;

      await integration.update(updateData);

      res.json({
        success: true,
        message: 'Integration updated successfully',
        data: integration
      });
    } catch (error) {
      console.error('Error updating integration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update integration'
      });
    }
  }

  /**
   * Get integration status and last sync info
   */
  async getIntegrationStatus(req, res) {
    try {
      const { id } = req.params;

      const integration = await Integration.findOne({
        where: {
          id,
          userId: req.user.id
        },
        attributes: { exclude: ['accessToken', 'refreshToken'] }
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: 'Integration not found'
        });
      }

      res.json({
        success: true,
        data: {
          platform: integration.platform,
          status: integration.syncStatus,
          lastSynced: integration.lastSyncedAt,
          syncEnabled: integration.syncEnabled,
          isActive: integration.isActive,
          errors: integration.syncErrors
        }
      });
    } catch (error) {
      console.error('Error fetching integration status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch integration status'
      });
    }
  }
}

module.exports = new IntegrationController();
