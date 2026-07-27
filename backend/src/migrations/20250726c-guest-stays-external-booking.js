'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Make bookingId nullable so external (Evolve/Airbnb/VRBO) stays can be recorded
    await queryInterface.changeColumn('guest_stays', 'bookingId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'bookings', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    })

    await queryInterface.addColumn('guest_stays', 'externalBookingId', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Booking ID from Evolve/Airbnb/VRBO/Booking.com'
    })

    await queryInterface.addColumn('guest_stays', 'bookingSource', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'airbnb, vrbo, evolve, booking.com, website, manual'
    })

    // Make email nullable so phone-only guests can be imported
    await queryInterface.changeColumn('guests', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    })

    await queryInterface.addIndex('guest_stays', ['externalBookingId'], { name: 'guest_stays_external_booking_id' })
    await queryInterface.addIndex('guest_stays', ['bookingSource'], { name: 'guest_stays_booking_source' })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('guest_stays', 'guest_stays_external_booking_id')
    await queryInterface.removeIndex('guest_stays', 'guest_stays_booking_source')
    await queryInterface.removeColumn('guest_stays', 'externalBookingId')
    await queryInterface.removeColumn('guest_stays', 'bookingSource')
    await queryInterface.changeColumn('guest_stays', 'bookingId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: 'bookings', key: 'id' }
    })
    await queryInterface.changeColumn('guests', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    })
  }
}
