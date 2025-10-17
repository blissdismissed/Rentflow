/**
 * Database Reset Script
 * WARNING: This will delete ALL data in the database!
 * Use this only in development to fix schema issues.
 */

require('dotenv').config()
const { sequelize } = require('./src/config/database')

async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete ALL data!')
    console.log('🔄 Dropping and recreating all tables...')

    // Force sync - drops and recreates all tables
    await sequelize.sync({ force: true })

    console.log('✅ Database reset complete!')
    console.log('📊 All tables have been recreated with the latest schema')
    console.log('')
    console.log('You can now start your server with: npm run dev')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    process.exit(1)
  }
}

resetDatabase()
