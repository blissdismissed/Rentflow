const { sequelize } = require('../../src/config/database')

/**
 * Clear all data from tables (except migrations)
 */
async function clearDatabase() {
  const models = Object.keys(sequelize.models).filter(m => m !== 'SequelizeMeta')

  // Disable foreign key checks temporarily
  await sequelize.query('SET session_replication_role = replica;')

  for (const modelName of models) {
    const model = sequelize.models[modelName]
    await model.destroy({ where: {}, force: true })
  }

  // Re-enable foreign key checks
  await sequelize.query('SET session_replication_role = DEFAULT;')
}

/**
 * Set up test database before tests
 */
async function setupTestDatabase() {
  try {
    await sequelize.authenticate()
    // Force sync to create fresh tables for testing
    await sequelize.sync({ force: true })
  } catch (error) {
    console.error('Failed to setup test database:', error)
    throw error
  }
}

/**
 * Tear down test database after tests
 */
async function teardownTestDatabase() {
  try {
    await clearDatabase()
    await sequelize.close()
  } catch (error) {
    console.error('Failed to teardown test database:', error)
    throw error
  }
}

/**
 * Create a fresh database state for each test
 */
async function resetDatabase() {
  await clearDatabase()
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  resetDatabase,
  clearDatabase
}
