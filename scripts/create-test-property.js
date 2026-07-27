const path = require('path')

// Get the project root directory (parent of scripts folder)
const projectRoot = path.join(__dirname, '..')

// Load dotenv from backend's node_modules
require(path.join(projectRoot, 'backend/node_modules/dotenv')).config({
  path: path.join(projectRoot, 'backend/.env')
})

// Load modules using absolute paths
const { sequelize } = require(path.join(projectRoot, 'backend/src/config/database'))
const Property = require(path.join(projectRoot, 'backend/src/models/Property'))
const User = require(path.join(projectRoot, 'backend/src/models/User'))
const { generatePropertyImagePaths } = require('./helpers/imagePathHelper')

/**
 * Script to create the Bromley Condo test property
 * Run this to populate your database with the property
 *
 * Usage (from project root):
 *   node scripts/create-test-property.js                    # Uses first user in database
 *   node scripts/create-test-property.js your@email.com     # Uses specific user email
 */

async function createBromleyProperty() {
  try {
    await sequelize.authenticate()
    console.log('✓ Connected to database')

    // Get user email from command line argument or find first user
    const userEmail = process.argv[2] // node create-test-property.js your@email.com

    let user
    if (userEmail) {
      user = await User.findOne({ where: { email: userEmail } })
      if (!user) {
        console.log(`❌ User with email '${userEmail}' not found.`)
        console.log('Please sign up first or use a different email.')
        process.exit(1)
      }
    } else {
      // If no email provided, use the first user
      user = await User.findOne()
      if (!user) {
        console.log('❌ No users found in database.')
        console.log('Please create a user account first by signing up at /auth/signup.html')
        console.log('\nThen run: node create-test-property.js your@email.com')
        process.exit(1)
      }
    }

    console.log(`✓ Using user: ${user.email} (ID: ${user.id})`)

    // Check if property already exists
    const existing = await Property.findOne({ where: { slug: 'bromley-mountain-ski-condo' } })

    if (existing) {
      console.log('⚠ Property already exists. Updating...')
      console.log(`   Property ID: ${existing.id}`)

      // Generate image paths based on property ID
      const imageFiles = ['main.jpg', 'living-room.jpg', 'bedroom.jpg', 'kitchen.jpg']
      const imagePaths = generatePropertyImagePaths(existing.id, imageFiles)

      await existing.update({
        name: 'Bromley Village Ski Condo - Vermont Vacation Rental',
        type: 'condo',
        description: `Welcome to your perfect Vermont getaway! This cozy ski condo is located in the heart of Bromley Village, offering year-round adventure and relaxation.

🏔️ Winter Wonderland (Dec-Apr)
Hit the slopes at Bromley Mountain, just minutes away! Our condo is the perfect base for your ski vacation with ski-in/ski-out access.

🍂 Fall Foliage Paradise (Sep-Nov)
Experience Vermont's world-famous fall colors. The surrounding mountains transform into a breathtaking palette of reds, oranges, and golds.

☀️ Summer Adventure (May-Aug)
Explore the Appalachian Trail, go hiking, mountain biking, or simply relax and enjoy the fresh mountain air.

The Space:
This beautifully maintained condo features modern amenities while retaining classic Vermont charm. Perfect for families, couples, or small groups looking to experience the best of Vermont.

Book Direct & Save:
• 15% discount when you book directly (vs. Airbnb/VRBO)
• Additional 10% off when paying with cryptocurrency (BTC/ETH)
• No platform fees - better value for you!`,
        address: '123 Bromley Village Road',
        city: 'Peru',
        state: 'Vermont',
        zipCode: '05152',
        country: 'USA',
        latitude: 43.2184,
        longitude: -72.9476,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 6,
        squareFeet: 1200,
        amenities: [
          'WiFi',
          'Full Kitchen',
          'Fireplace',
          'Heated Floors',
          'Smart TV',
          'Washer/Dryer',
          'Free Parking',
          'Ski Storage',
          'Mountain Views',
          'BBQ Grill',
          'Coffee Maker',
          'Dishwasher',
          'Microwave',
          'Hair Dryer',
          'Iron & Ironing Board',
          'Linens & Towels'
        ],
        images: imagePaths.images,
        featuredImage: imagePaths.featuredImage,
        basePrice: 250,
        cleaningFee: 100,
        securityDeposit: 300,
        minNights: 2,
        maxNights: 30,
        status: 'active',
        isActive: true,
        publiclyVisible: true,
        slug: 'bromley-mountain-ski-condo',
        houseRules: `• No smoking inside
• No parties or events
• Quiet hours: 10 PM - 8 AM
• Maximum occupancy: 6 guests
• Pets allowed (with prior approval, $50 fee)
• Please remove ski boots before entering
• Respect our neighbors
• Check-out cleaning: Please start dishwasher and take out trash`,
        cancellationPolicy: 'moderate',
        checkInInstructions: `Welcome to Bromley Village!

Check-in time: 3:00 PM
Check-out time: 11:00 AM

Access Instructions:
1. Park in the designated spot #23
2. Use the lockbox code (will be sent 24 hours before arrival)
3. Front door is the green door on the second floor
4. Ski storage is in the basement - key in the unit

WiFi Details:
Network: BromleyGuest
Password: VermontSki2024

Emergency Contacts:
Host: (555) 123-4567
Property Manager: (555) 987-6543

Enjoy your stay!`,
        instantBook: false
      })

      console.log('✅ Property updated successfully!')
      console.log(`\n📁 Upload your images to S3 at:`)
      console.log(`   /assets/properties/${existing.id}/`)
      console.log(`   - main.jpg`)
      console.log(`   - living-room.jpg`)
      console.log(`   - bedroom.jpg`)
      console.log(`   - kitchen.jpg`)
    } else {
      // Create property without images first
      const property = await Property.create({
        userId: user.id,
        name: 'Bromley Village Ski Condo - Vermont Vacation Rental',
        type: 'condo',
        description: `Welcome to your perfect Vermont getaway! This cozy ski condo is located in the heart of Bromley Village, offering year-round adventure and relaxation.

🏔️ Winter Wonderland (Dec-Apr)
Hit the slopes at Bromley Mountain, just minutes away! Our condo is the perfect base for your ski vacation with ski-in/ski-out access.

🍂 Fall Foliage Paradise (Sep-Nov)
Experience Vermont's world-famous fall colors. The surrounding mountains transform into a breathtaking palette of reds, oranges, and golds.

☀️ Summer Adventure (May-Aug)
Explore the Appalachian Trail, go hiking, mountain biking, or simply relax and enjoy the fresh mountain air.

The Space:
This beautifully maintained condo features modern amenities while retaining classic Vermont charm. Perfect for families, couples, or small groups looking to experience the best of Vermont.

Book Direct & Save:
• 15% discount when you book directly (vs. Airbnb/VRBO)
• Additional 10% off when paying with cryptocurrency (BTC/ETH)
• No platform fees - better value for you!`,
        address: '123 Bromley Village Road',
        city: 'Peru',
        state: 'Vermont',
        zipCode: '05152',
        country: 'USA',
        latitude: 43.2184,
        longitude: -72.9476,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 6,
        squareFeet: 1200,
        amenities: [
          'WiFi',
          'Full Kitchen',
          'Fireplace',
          'Heated Floors',
          'Smart TV',
          'Washer/Dryer',
          'Free Parking',
          'Ski Storage',
          'Mountain Views',
          'BBQ Grill',
          'Coffee Maker',
          'Dishwasher',
          'Microwave',
          'Hair Dryer',
          'Iron & Ironing Board',
          'Linens & Towels'
        ],
        images: imagePaths.images,
        featuredImage: imagePaths.featuredImage,
        basePrice: 250,
        cleaningFee: 100,
        securityDeposit: 300,
        minNights: 2,
        maxNights: 30,
        status: 'active',
        isActive: true,
        publiclyVisible: true,
        slug: 'bromley-mountain-ski-condo',
        houseRules: `• No smoking inside
• No parties or events
• Quiet hours: 10 PM - 8 AM
• Maximum occupancy: 6 guests
• Pets allowed (with prior approval, $50 fee)
• Please remove ski boots before entering
• Respect our neighbors
• Check-out cleaning: Please start dishwasher and take out trash`,
        cancellationPolicy: 'moderate',
        checkInInstructions: `Welcome to Bromley Village!

Check-in time: 3:00 PM
Check-out time: 11:00 AM

Access Instructions:
1. Park in the designated spot #23
2. Use the lockbox code (will be sent 24 hours before arrival)
3. Front door is the green door on the second floor
4. Ski storage is in the basement - key in the unit

WiFi Details:
Network: BromleyGuest
Password: VermontSki2024

Emergency Contacts:
Host: (555) 123-4567
Property Manager: (555) 987-6543

Enjoy your stay!`,
        instantBook: false
      })

      // Now update with properly indexed images
      const imageFiles = ['main.jpg', 'living-room.jpg', 'bedroom.jpg', 'kitchen.jpg']
      const imagePaths = generatePropertyImagePaths(property.id, imageFiles)

      await property.update({
        images: imagePaths.images,
        featuredImage: imagePaths.featuredImage
      })

      console.log('✅ Bromley Condo property created successfully!')
      console.log(`\nProperty Details:`)
      console.log(`- ID: ${property.id}`)
      console.log(`- User ID: ${user.id}`)
      console.log(`- Name: ${property.name}`)
      console.log(`- Slug: ${property.slug}`)
      console.log(`- Price: $${property.basePrice}/night`)
      console.log(`- Cleaning Fee: $${property.cleaningFee}`)

      console.log(`\n📁 Upload your images to S3 at:`)
      console.log(`   /assets/properties/${property.id}/`)
      console.log(`   - main.jpg`)
      console.log(`   - living-room.jpg`)
      console.log(`   - bedroom.jpg`)
      console.log(`   - kitchen.jpg`)
    }

    console.log(`\n🌐 View your property at:`)
    console.log(`   https://aspiretowards.com/property.html?slug=bromley-mountain-ski-condo`)
    console.log(`\nOr locally at:`)
    console.log(`   http://localhost:8080/property.html?slug=bromley-mountain-ski-condo`)

  } catch (error) {
    console.error('❌ Error creating property:', error.message)
    console.error(error)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

// Run the script
createBromleyProperty()
