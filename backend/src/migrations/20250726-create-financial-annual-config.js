'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('financial_annual_config', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE'
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      scheduledMortgage: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Monthly scheduled mortgage payment'
      },
      taxesInsurance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Annual taxes and insurance total'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    })

    await queryInterface.addConstraint('financial_annual_config', {
      fields: ['propertyId', 'year'],
      type: 'unique',
      name: 'unique_property_year_config'
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('financial_annual_config')
  }
}
