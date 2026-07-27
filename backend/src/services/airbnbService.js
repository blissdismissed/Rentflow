const axios = require('axios');
const Integration = require('../models/Integration');
const Property = require('../models/Property');
const Booking = require('../models/Booking');

class AirbnbService {
  constructor() {
    this.baseUrl = 'https://api.airbnb.com/v2';
    this.authUrl = 'https://www.airbnb.com/oauth2/auth';
    this.tokenUrl = 'https://api.airbnb.com/v2/oauth2/token';
    this.clientId = process.env.AIRBNB_CLIENT_ID;
    this.clientSecret = process.env.AIRBNB_CLIENT_SECRET;
    this.redirectUri = process.env.AIRBNB_REDIRECT_URI;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(userId, state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'listing_read listing_write calendar_read calendar_write reservations_read reservations_write',
      state: state || userId
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code) {
    try {
      const response = await axios.post(this.tokenUrl, {
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error('Failed to obtain access token from Airbnb');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(this.tokenUrl, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type
      };
    } catch (error) {
      console.error('Error refreshing token:', error.response?.data || error.message);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(integration, method, endpoint, data = null) {
    // Check if token needs refresh
    if (integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) <= new Date()) {
      const tokens = await this.refreshAccessToken(integration.refreshToken);

      await integration.update({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
      });
    }

    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`,
          'Content-Type': 'application/json',
          'X-Airbnb-API-Key': this.clientId
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Airbnb API Error (${method} ${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Fetch all listings for the authenticated user
   */
  async fetchListings(integration) {
    const data = await this.makeRequest(integration, 'GET', '/listings');
    return data.listings || [];
  }

  /**
   * Fetch a specific listing
   */
  async fetchListing(integration, listingId) {
    const data = await this.makeRequest(integration, 'GET', `/listings/${listingId}`);
    return data.listing;
  }

  /**
   * Fetch reservations for a listing
   */
  async fetchReservations(integration, listingId, startDate, endDate) {
    const params = new URLSearchParams({
      listing_id: listingId,
      start_date: startDate,
      end_date: endDate
    });

    const data = await this.makeRequest(integration, 'GET', `/reservations?${params.toString()}`);
    return data.reservations || [];
  }

  /**
   * Update calendar availability
   */
  async updateAvailability(integration, listingId, availabilityRules) {
    const data = await this.makeRequest(
      integration,
      'PUT',
      `/listings/${listingId}/calendar`,
      { availability_rules: availabilityRules }
    );
    return data;
  }

  /**
   * Update listing pricing
   */
  async updatePricing(integration, listingId, pricingRules) {
    const data = await this.makeRequest(
      integration,
      'PUT',
      `/listings/${listingId}/pricing`,
      { pricing_rules: pricingRules }
    );
    return data;
  }

  /**
   * Sync all listings from Airbnb to local database
   */
  async syncListings(integration) {
    try {
      const airbnbListings = await this.fetchListings(integration);
      const syncedProperties = [];

      for (const listing of airbnbListings) {
        // Check if property already exists
        let property = await Property.findOne({
          where: {
            userId: integration.userId,
            externalId: listing.id,
            platform: 'airbnb'
          }
        });

        const propertyData = {
          userId: integration.userId,
          name: listing.name,
          description: listing.description,
          address: listing.address?.street || '',
          city: listing.address?.city || '',
          state: listing.address?.state || '',
          country: listing.address?.country || '',
          zipCode: listing.address?.zipcode || '',
          latitude: listing.address?.lat,
          longitude: listing.address?.lng,
          propertyType: listing.property_type,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          maxGuests: listing.person_capacity,
          basePrice: listing.price,
          cleaningFee: listing.cleaning_fee,
          amenities: listing.amenities || [],
          images: listing.photos?.map(p => p.large_url) || [],
          externalId: listing.id,
          platform: 'airbnb',
          isActive: listing.has_availability
        };

        if (property) {
          await property.update(propertyData);
        } else {
          property = await Property.create(propertyData);
        }

        // Update integration with property link
        if (!integration.propertyId) {
          await integration.update({
            propertyId: property.id,
            platformListingId: listing.id
          });
        }

        syncedProperties.push(property);
      }

      await integration.update({
        lastSyncedAt: new Date(),
        syncStatus: 'active',
        syncErrors: []
      });

      return syncedProperties;
    } catch (error) {
      console.error('Error syncing listings:', error);

      await integration.update({
        syncStatus: 'error',
        syncErrors: [{
          timestamp: new Date(),
          error: error.message,
          details: error.response?.data
        }]
      });

      throw error;
    }
  }

  /**
   * Sync reservations from Airbnb
   */
  async syncReservations(integration, propertyId, daysBack = 90, daysForward = 365) {
    try {
      const property = await Property.findByPk(propertyId);
      if (!property || !property.externalId) {
        throw new Error('Property not found or not linked to Airbnb');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysForward);

      const reservations = await this.fetchReservations(
        integration,
        property.externalId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      const syncedBookings = [];

      for (const reservation of reservations) {
        let booking = await Booking.findOne({
          where: {
            externalId: reservation.confirmation_code,
            platform: 'airbnb'
          }
        });

        const bookingData = {
          userId: integration.userId,
          propertyId: property.id,
          guestName: reservation.guest?.name || 'Airbnb Guest',
          guestEmail: reservation.guest?.email,
          guestPhone: reservation.guest?.phone,
          checkIn: reservation.start_date,
          checkOut: reservation.end_date,
          numberOfGuests: reservation.number_of_guests,
          totalAmount: reservation.total_paid_amount_accurate,
          platformFee: reservation.host_service_fee_accurate,
          netAmount: reservation.expected_payout_amount_accurate,
          status: this.mapReservationStatus(reservation.status),
          externalId: reservation.confirmation_code,
          platform: 'airbnb',
          metadata: {
            listing_id: reservation.listing_id,
            nights: reservation.nights,
            cancellation_policy: reservation.cancellation_policy_category
          }
        };

        if (booking) {
          await booking.update(bookingData);
        } else {
          booking = await Booking.create(bookingData);
        }

        syncedBookings.push(booking);
      }

      return syncedBookings;
    } catch (error) {
      console.error('Error syncing reservations:', error);
      throw error;
    }
  }

  /**
   * Map Airbnb reservation status to our status
   */
  mapReservationStatus(airbnbStatus) {
    const statusMap = {
      'pending': 'pending',
      'accept': 'confirmed',
      'pending_payment': 'pending',
      'canceled': 'cancelled',
      'at_checkpoint': 'confirmed',
      'deny': 'cancelled'
    };

    return statusMap[airbnbStatus] || 'pending';
  }

  /**
   * Push local availability to Airbnb
   */
  async pushAvailability(integration, propertyId, blockedDates) {
    try {
      const property = await Property.findByPk(propertyId);
      if (!property || !property.externalId) {
        throw new Error('Property not found or not linked to Airbnb');
      }

      const availabilityRules = blockedDates.map(date => ({
        date: date.date,
        available: date.available,
        min_nights: date.minNights || property.minNights || 1,
        max_nights: date.maxNights || property.maxNights || 365
      }));

      await this.updateAvailability(integration, property.externalId, availabilityRules);

      return { success: true, updatedDates: blockedDates.length };
    } catch (error) {
      console.error('Error pushing availability:', error);
      throw error;
    }
  }

  /**
   * Push pricing updates to Airbnb
   */
  async pushPricing(integration, propertyId, pricingData) {
    try {
      const property = await Property.findByPk(propertyId);
      if (!property || !property.externalId) {
        throw new Error('Property not found or not linked to Airbnb');
      }

      await this.updatePricing(integration, property.externalId, pricingData);

      return { success: true };
    } catch (error) {
      console.error('Error pushing pricing:', error);
      throw error;
    }
  }
}

module.exports = new AirbnbService();
