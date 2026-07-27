const { DataTypes, Model } = require('sequelize')
const { sequelize } = require('../config/database')

class Cleaner extends Model {}

Cleaner.init(
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
      },
      comment: 'User account for cleaner (role: cleaner)'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Cleaner full name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      },
      comment: 'Cleaner contact email'
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Cleaner contact phone'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the cleaner'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether cleaner is active'
    }
  },
  {
    sequelize,
    modelName: 'Cleaner',
    tableName: 'cleaners',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['email']
      }
    ]
  }
)

module.exports = Cleaner
