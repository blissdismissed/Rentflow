const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class Financial extends Model {}

Financial.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true,
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
    type: {
      type: DataTypes.ENUM('revenue', 'expense', 'refund', 'payout'),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM(
        'booking_revenue',
        'cleaning',
        'maintenance',
        'utilities',
        'marketing',
        'insurance',
        'taxes',
        'supplies',
        'management_fee',
        'other'
      ),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receiptUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    taxDeductible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    channel: {
      type: DataTypes.ENUM('direct', 'airbnb', 'vrbo', 'booking_com', 'manual', 'other'),
      defaultValue: 'manual'
    },
    channelTransactionId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payoutId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'Financial',
    tableName: 'financials',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['propertyId']
      },
      {
        fields: ['bookingId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['date']
      }
    ]
  }
)

module.exports = Financial
