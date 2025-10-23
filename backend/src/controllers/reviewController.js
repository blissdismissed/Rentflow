const Review = require('../models/Review');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const Guest = require('../models/Guest');
const { Op } = require('sequelize');

// Get all reviews for a property (public)
exports.getPropertyReviews = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { platform, minRating, limit = 50, offset = 0 } = req.query;

    const where = {
      propertyId,
      isPublished: true
    };

    if (platform) {
      where.platform = platform;
    }

    if (minRating) {
      where.rating = { [Op.gte]: parseFloat(minRating) };
    }

    const reviews = await Review.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Property,
          attributes: ['id', 'name']
        }
      ]
    });

    // Calculate average ratings
    const allReviews = await Review.findAll({
      where: { propertyId, isPublished: true },
      attributes: ['rating', 'cleanliness', 'communication', 'checkIn', 'accuracy', 'location', 'value']
    });

    const avgRatings = {
      overall: 0,
      cleanliness: 0,
      communication: 0,
      checkIn: 0,
      accuracy: 0,
      location: 0,
      value: 0,
      totalReviews: allReviews.length
    };

    if (allReviews.length > 0) {
      avgRatings.overall = (allReviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / allReviews.length).toFixed(1);

      const categories = ['cleanliness', 'communication', 'checkIn', 'accuracy', 'location', 'value'];
      categories.forEach(cat => {
        const validReviews = allReviews.filter(r => r[cat] !== null);
        if (validReviews.length > 0) {
          avgRatings[cat] = (validReviews.reduce((sum, r) => sum + parseFloat(r[cat]), 0) / validReviews.length).toFixed(1);
        }
      });
    }

    res.json({
      success: true,
      reviews: reviews.rows,
      total: reviews.count,
      averages: avgRatings,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching property reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

// Get all reviews for owner (all properties, all platforms)
exports.getOwnerReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform, propertyId, minRating, limit = 50, offset = 0 } = req.query;

    // Get all owner's properties
    const properties = await Property.findAll({
      where: { userId },
      attributes: ['id']
    });

    const propertyIds = properties.map(p => p.id);

    const where = {
      propertyId: { [Op.in]: propertyIds }
    };

    if (platform) {
      where.platform = platform;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (minRating) {
      where.rating = { [Op.gte]: parseFloat(minRating) };
    }

    const reviews = await Review.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Property,
          attributes: ['id', 'name', 'city', 'state']
        },
        {
          model: Booking,
          attributes: ['id', 'checkIn', 'checkOut'],
          required: false
        }
      ]
    });

    // Calculate stats by platform
    const platformStats = {};
    const allOwnerReviews = await Review.findAll({
      where: { propertyId: { [Op.in]: propertyIds } },
      attributes: ['platform', 'rating']
    });

    allOwnerReviews.forEach(review => {
      if (!platformStats[review.platform]) {
        platformStats[review.platform] = {
          count: 0,
          totalRating: 0,
          avgRating: 0
        };
      }
      platformStats[review.platform].count++;
      platformStats[review.platform].totalRating += parseFloat(review.rating);
    });

    Object.keys(platformStats).forEach(platform => {
      platformStats[platform].avgRating = (platformStats[platform].totalRating / platformStats[platform].count).toFixed(1);
    });

    res.json({
      success: true,
      reviews: reviews.rows,
      total: reviews.count,
      platformStats,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching owner reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

// Create a review (guest submits after stay)
exports.createReview = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const {
      bookingId,
      guestName,
      guestEmail,
      rating,
      cleanliness,
      communication,
      checkIn,
      accuracy,
      location,
      value,
      title,
      comment,
      platform = 'direct'
    } = req.body;

    // Verify property exists
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // If bookingId provided, verify it exists and belongs to this property
    if (bookingId) {
      const booking = await Booking.findByPk(bookingId);
      if (!booking || booking.propertyId !== propertyId) {
        return res.status(400).json({ success: false, message: 'Invalid booking' });
      }

      // Check if review already exists for this booking
      const existingReview = await Review.findOne({ where: { bookingId } });
      if (existingReview) {
        return res.status(400).json({ success: false, message: 'Review already submitted for this booking' });
      }
    }

    // Find or create guest
    let guest = null;
    if (guestEmail) {
      [guest] = await Guest.findOrCreate({
        where: { email: guestEmail },
        defaults: { name: guestName }
      });
    }

    const review = await Review.create({
      propertyId,
      bookingId: bookingId || null,
      guestId: guest ? guest.id : null,
      guestName,
      guestEmail,
      rating,
      cleanliness,
      communication,
      checkIn,
      accuracy,
      location,
      value,
      title,
      comment,
      platform,
      isVerified: bookingId ? true : false, // Verified if tied to a booking
      isPublished: true
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: 'Failed to create review', error: error.message });
  }
};

// Update review (owner response)
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { ownerResponse, isPublished } = req.body;

    const review = await Review.findByPk(reviewId, {
      include: [{ model: Property, attributes: ['userId'] }]
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Verify user owns the property
    if (review.Property.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = {};
    if (ownerResponse !== undefined) {
      updates.ownerResponse = ownerResponse;
      updates.ownerResponseDate = new Date();
    }
    if (isPublished !== undefined) {
      updates.isPublished = isPublished;
    }

    await review.update(updates);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ success: false, message: 'Failed to update review', error: error.message });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await review.increment('isHelpful');

    res.json({
      success: true,
      message: 'Marked as helpful',
      helpfulCount: review.isHelpful + 1
    });
  } catch (error) {
    console.error('Error marking review helpful:', error);
    res.status(500).json({ success: false, message: 'Failed to mark helpful', error: error.message });
  }
};

// Import external review (from Airbnb, VRBO, etc.)
exports.importExternalReview = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const {
      externalReviewId,
      platform,
      guestName,
      rating,
      comment,
      checkInDate,
      checkOutDate
    } = req.body;

    // Verify user owns the property
    const property = await Property.findByPk(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if external review already imported
    const existing = await Review.findOne({
      where: {
        propertyId,
        platform,
        externalReviewId
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Review already imported' });
    }

    const review = await Review.create({
      propertyId,
      externalReviewId,
      platform,
      guestName,
      rating,
      comment,
      checkInDate: checkInDate ? new Date(checkInDate) : null,
      checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
      isVerified: true,
      isPublished: true
    });

    res.status(201).json({
      success: true,
      message: 'External review imported successfully',
      review
    });
  } catch (error) {
    console.error('Error importing external review:', error);
    res.status(500).json({ success: false, message: 'Failed to import review', error: error.message });
  }
};

module.exports = exports;
