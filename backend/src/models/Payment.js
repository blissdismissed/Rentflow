const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD'
    },
    paymentMethod: {
      type: DataTypes.ENUM('credit_card', 'venmo', 'bitcoin', 'bank_transfer', 'cash'),
      allowNull: false
    },
    paymentProcessor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    paymentDetails: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    indexes: [
      {
        fields: ['bookingId']
      },
      {
        fields: ['transactionId']
      },
      {
        fields: ['status']
      }
    ]
  }
)

module.exports = Payment
