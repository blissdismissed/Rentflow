#!/usr/bin/env node

/**
 * Clear Test Bookings Script
 * Safely removes test bookings from the database
 *
 * Usage:
 *   node scripts/clear-test-bookings.js --all
 *   node scripts/clear-test-bookings.js --status requested
 *   node scripts/clear-test-bookings.js --email test@example.com
 *   node scripts/clear-test-bookings.js --before 2025-01-01
 */

require('dotenv').config();
const { Booking } = require('../src/models');
const { Op } = require('sequelize');

async function clearBookings() {
  try {
    const args = process.argv.slice(2);

    if (args.length === 0) {
      console.log('❌ No arguments provided!');
      console.log('\nUsage:');
      console.log('  --all                          Delete ALL bookings');
      console.log('  --status <status>              Delete by status (requested, approved, confirmed, declined, cancelled)');
      console.log('  --email <email>                Delete by guest email');
      console.log('  --before <date>                Delete bookings created before date (YYYY-MM-DD)');
      console.log('  --confirmation <code>          Delete by confirmation code');
      process.exit(1);
    }

    let whereClause = {};
    let description = '';

    // Parse arguments
    if (args[0] === '--all') {
      description = 'ALL bookings';
    } else if (args[0] === '--status' && args[1]) {
      whereClause.bookingStatus = args[1];
      description = `bookings with status "${args[1]}"`;
    } else if (args[0] === '--email' && args[1]) {
      whereClause.guestEmail = args[1];
      description = `bookings for email "${args[1]}"`;
    } else if (args[0] === '--before' && args[1]) {
      whereClause.createdAt = { [Op.lt]: new Date(args[1]) };
      description = `bookings created before ${args[1]}`;
    } else if (args[0] === '--confirmation' && args[1]) {
      whereClause.confirmationCode = args[1];
      description = `booking with confirmation code "${args[1]}"`;
    } else {
      console.log('❌ Invalid arguments!');
      process.exit(1);
    }

    // Show what will be deleted
    const count = await Booking.count({ where: whereClause });

    if (count === 0) {
      console.log(`✅ No bookings found matching criteria.`);
      process.exit(0);
    }

    console.log(`\n⚠️  WARNING: About to delete ${count} ${description}`);
    console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete bookings
    const deleted = await Booking.destroy({ where: whereClause });

    console.log(`✅ Successfully deleted ${deleted} booking(s)!`);
    console.log(`\nRemaining bookings: ${await Booking.count()}`);

  } catch (error) {
    console.error('❌ Error clearing bookings:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

clearBookings();
