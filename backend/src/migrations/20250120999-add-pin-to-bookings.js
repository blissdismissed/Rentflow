'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bookings', 'assignedLockPin', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Lock PIN assigned to this booking'
    });

    await queryInterface.addColumn('bookings', 'lockPinId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'property_lock_pins',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Reference to the PropertyLockPin used'
    });

    await queryInterface.addColumn('bookings', 'preStayEmailSentAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When pre-stay email was sent'
    });

    await queryInterface.addColumn('bookings', 'postStayEmailSentAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When post-stay email was sent'
    });

    // Add index
    await queryInterface.addIndex('bookings', ['lockPinId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bookings', 'assignedLockPin');
    await queryInterface.removeColumn('bookings', 'lockPinId');
    await queryInterface.removeColumn('bookings', 'preStayEmailSentAt');
    await queryInterface.removeColumn('bookings', 'postStayEmailSentAt');
  }
};
