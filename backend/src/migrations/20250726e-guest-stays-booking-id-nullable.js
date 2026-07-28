'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('guest_stays', 'bookingId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'bookings', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('guest_stays', 'bookingId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'bookings', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    })
  }
}
