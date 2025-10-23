const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'properties',
      key: 'id'
    }
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  guestId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'guests',
      key: 'id'
    }
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  guestEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  cleanliness: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  communication: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  checkIn: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  accuracy: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  location: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  value: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  platform: {
    type: DataTypes.ENUM('direct', 'airbnb', 'vrbo', 'booking_com', 'other'),
    defaultValue: 'direct'
  },
  externalReviewId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ownerResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ownerResponseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isHelpful: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    { fields: ['propertyId'] },
    { fields: ['bookingId'] },
    { fields: ['guestId'] },
    { fields: ['platform'] },
    { fields: ['rating'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Review;
