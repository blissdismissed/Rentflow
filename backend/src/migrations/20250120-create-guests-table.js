'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('guests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      totalStays: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalSpent: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      firstStayDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastStayDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      preferences: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      marketingOptIn: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isBlacklisted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      blacklistReason: {
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

    // Add indexes
    await queryInterface.addIndex('guests', ['email']);
    await queryInterface.addIndex('guests', ['totalStays']);
    await queryInterface.addIndex('guests', ['lastStayDate']);
    await queryInterface.addIndex('guests', ['marketingOptIn']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('guests');
  }
};
