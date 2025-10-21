const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class Guest extends Model {}

Guest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      },
      comment: 'Primary identifier for guest'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Guest full name'
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Guest phone number'
    },
    totalStays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of completed stays'
    },
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Total amount spent across all bookings'
    },
    firstStayDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of first stay'
    },
    lastStayDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of most recent stay'
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Guest preferences and notes'
    },
    marketingOptIn: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether guest opted in to marketing emails'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Tags for categorizing guests (VIP, repeat, etc.)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Private notes about the guest'
    },
    isBlacklisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether guest is blacklisted'
    },
    blacklistReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for blacklisting'
    }
  },
  {
    sequelize,
    modelName: 'Guest',
    tableName: 'guests',
    timestamps: true,
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['totalStays']
      },
      {
        fields: ['lastStayDate']
      },
      {
        fields: ['marketingOptIn']
      }
    ]
  }
)

module.exports = Guest
