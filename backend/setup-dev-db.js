#!/usr/bin/env node
/**
 * One-time script to set up local development database
 * This creates base tables using Sequelize sync, then runs migrations
 */

require('dotenv').config()
const { sequelize } = require('./src/config/database')

// Import all models to register them with Sequelize
require('./src/models')

async function setupDatabase() {
  try {
    console.log('🔧 Setting up local development database...\n')

    // Test connection
    console.log('1️⃣  Testing database connection...')
    await sequelize.authenticate()
    console.log('✅ Database connection established\n')

    // Sync all models to create base tables
    console.log('2️⃣  Creating base tables from models...')
    console.log(`   Found ${Object.keys(sequelize.models).length} models`)
    await sequelize.sync({ force: false, alter: false })
    console.log('✅ Base tables created\n')

    console.log('3️⃣  Now run migrations for additional features:')
    console.log('   npm run migrate\n')

    console.log('✅ Database setup complete!')
    process.exit(0)

  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  }
}

setupDatabase()
