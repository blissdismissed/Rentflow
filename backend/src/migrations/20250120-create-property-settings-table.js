'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('property_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'properties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rotatingPinsEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      currentPinIndex: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      preStayEmailEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      preStayEmailDays: {
        type: Sequelize.INTEGER,
        defaultValue: 3
      },
      postStayEmailEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      postStayEmailDays: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      checkInInstructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      wifiNetwork: {
        type: Sequelize.STRING,
        allowNull: true
      },
      wifiPassword: {
        type: Sequelize.STRING,
        allowNull: true
      },
      parkingInstructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      houseRules: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add index
    await queryInterface.addIndex('property_settings', ['propertyId'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('property_settings');
  }
};
