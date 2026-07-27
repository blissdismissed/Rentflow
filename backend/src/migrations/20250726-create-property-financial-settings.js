'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('property_financial_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'properties', key: 'id' },
        onDelete: 'CASCADE'
      },
      purchasePrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      dataSource: {
        type: Sequelize.STRING(20),
        defaultValue: 'manual',
        comment: 'evolve, caribbean, manual'
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('property_financial_settings')
  }
}
