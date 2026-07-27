/**
 * Seed Bromley Mountain Property
 * Run with: node backend/scripts/seed-bromley.js
 *
 * Make sure to:
 * 1. Have backend server NOT running (or it will conflict with DB connection)
 * 2. Update USER_EMAIL below with your actual email
 * 3. Run from project root directory
 */

require('dotenv').config({ path: './backend/.env' })
const { sequelize } = require('../src/config/database')
const Property = require('../src/models/Property')
const User = require('../src/models/User')

// UPDATE THIS WITH YOUR ACTUAL EMAIL
const USER_EMAIL = 'your@email.com' // <-- CHANGE THIS!

async function seedBromleyProperty() {
    try {
        console.log('🌱 Seeding Bromley Mountain property...')

        // Connect to database
        await sequelize.authenticate()
        console.log('✅ Database connected')

        // Find user
        const user = await User.findOne({ where: { email: USER_EMAIL } })
        if (!user) {
            throw new Error(`User not found with email: ${USER_EMAIL}. Please update USER_EMAIL in this script.`)
        }
        console.log(`✅ Found user: ${user.firstName} ${user.lastName}`)

        // Check if property already exists
        const existing = await Property.findOne({
            where: { slug: 'bromley-mountain-escape-2-balconies' }
        })

        if (existing) {
            console.log('⚠️  Property already exists! Updating instead of creating...')
            await existing.update(getPropertyData(user.id))
            console.log('✅ Property updated!')
        } else {
            // Create property
            const property = await Property.create(getPropertyData(user.id))
            console.log('✅ Property created!')
            console.log(`📍 Property ID: ${property.id}`)
        }

        console.log(`\n🎉 Success! View your property at:`)
        console.log(`   http://localhost:8000/public/property.html?slug=bromley-mountain-escape-2-balconies\n`)

        process.exit(0)
    } catch (error) {
        console.error('❌ Error seeding property:', error.message)
        process.exit(1)
    }
}

function getPropertyData(userId) {
    return {
        userId,
        name: 'Bromley Mountain Escape w/ 2 Balconies: Hike & Ski',
        type: 'condo',
        description: `Welcome to your family's perfect Vermont mountain escape! Nestled in the heart of Peru, Vermont, our spacious condo offers the ideal basecamp for creating unforgettable memories with your loved ones.

🏔️ MOUNTAIN ADVENTURES FOR THE WHOLE FAMILY
Just minutes from Bromley Mountain - Vermont's family-friendly ski resort known for its gentle slopes perfect for kids learning to ski. In summer, the mountain transforms into a hiking paradise with trails suitable for all ages and abilities.

🥾 APPALACHIAN TRAIL ACCESS
The legendary Appalachian Trail is right in your backyard! Whether you're seasoned hikers or looking for a family-friendly nature walk, you'll find trails that suit everyone. The kids will love earning their "AT hiker" bragging rights!

🏘️ CHARMING SMALL TOWN LIVING
Peru is a quintessential Vermont village where neighbors wave hello and local shops welcome families. The nearby town of Manchester offers fantastic shopping, dining, and family activities - all without the crowds of larger tourist destinations.

🏠 YOUR HOME AWAY FROM HOME
Our well-appointed condo features:
• 3 comfortable bedrooms - plenty of space for the whole family
• 2 full bathrooms - no fighting over the shower!
• 2 private balconies - morning coffee with mountain views, evening stargazing
• Fully equipped kitchen - save money by cooking family meals
• Cozy living area - perfect for game nights and movie marathons
• Free WiFi - for those moments when the kids need screen time
• Washer/dryer - pack light and stay longer!

☀️ FOUR SEASONS OF FAMILY FUN
❄️ Winter: Skiing, snowboarding, snow tubing, sledding
🌸 Spring: Maple syrup tours, wildflower hikes, fishing
☀️ Summer: Swimming, hiking, mountain biking, farmers markets
🍁 Fall: Leaf peeping, apple picking, harvest festivals

💙 WHY FAMILIES LOVE STAYING HERE
✓ Safe, quiet neighborhood perfect for kids
✓ Affordable compared to big resort hotels
✓ Space to spread out and relax
✓ Kitchen saves money on dining out
✓ Close to activities but peaceful retreat
✓ Free parking - no hassle with shuttles
✓ Pet-friendly (with approval) - bring your furry family member!

Whether you're introducing your kids to skiing, hiking the AT as a family milestone, or simply escaping for a relaxing mountain getaway, our Bromley condo is the perfect choice for families who want adventure, comfort, and value.

Book direct and save - we're a small family business, not a big corporation!`,
        address: '123 Mountain View Drive',
        city: 'Peru',
        state: 'VT',
        zipCode: '05152',
        country: 'USA',
        latitude: 43.2453,
        longitude: -72.8968,
        bedrooms: 3,
        bathrooms: 2.0,
        maxGuests: 8,
        squareFeet: 1400,
        amenities: [
            'WiFi',
            'Free parking',
            'Kitchen',
            'Washer/dryer',
            'Heating',
            'TV',
            'Balcony (2)',
            'Mountain views',
            'Family-friendly',
            'Near ski resort',
            'Hiking nearby',
            'Pet-friendly (with approval)',
            'Coffee maker',
            'Dishwasher',
            'Linens provided',
            'Towels provided',
            'Hair dryer',
            'Iron',
            'Board games',
            'Books'
        ],
        images: [
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800',
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800'
        ],
        basePrice: 175.00,
        cleaningFee: 100.00,
        securityDeposit: 200.00,
        pricingRules: [],
        status: 'active',
        bookingSettings: {
            minStay: 2,
            maxStay: 14,
            checkInTime: '16:00',
            checkOutTime: '10:00',
            instantBooking: false,
            cancellationPolicy: 'moderate'
        },
        isListed: true,
        isActive: true,
        minNights: 2,
        maxNights: 14,
        slug: 'bromley-mountain-escape-2-balconies',
        featuredImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        houseRules: `HOUSE RULES - KEEPING IT FAMILY FRIENDLY

✓ Perfect for families with children
✓ Quiet hours: 10 PM - 8 AM (respect our neighbors)
✓ Maximum occupancy: 8 guests
✓ No smoking anywhere on property
✓ No parties or events
✓ Pets allowed with prior approval (+$50 fee)
✓ Please remove ski boots before entering
✓ Kids welcome to play, but please supervise
✓ Respect the mountain - pack out what you pack in
✓ Leave hiking boots outside
✓ Clean up after meals in shared spaces
✓ Report any damage immediately

We want your family to feel at home while being respectful of the property and our neighbors. This is a residential area with other families, so we appreciate your consideration!`,
        cancellationPolicy: 'moderate',
        checkInInstructions: `WELCOME TO BROMLEY MOUNTAIN ESCAPE!

CHECK-IN INFORMATION:
📍 Address: 123 Mountain View Drive, Peru, VT 05152
⏰ Check-in Time: 4:00 PM or later
🔑 Self Check-in: Lockbox code will be sent 24 hours before arrival

GETTING HERE:
• From Manchester (15 minutes): Take Route 11 East
• From Rutland (30 minutes): Take Route 7 South to Route 11 West
• GPS works well - just enter the address!
• Free parking: 2 spaces directly in front of unit

FIRST THINGS TO KNOW:
🏠 Unit is on second floor (one flight of stairs)
🌡️ Thermostat: Set between 65-70°F please
📶 WiFi: Network name and password on kitchen counter
🗑️ Trash: Dumpster behind building, please bag all trash

ESSENTIALS PROVIDED:
✓ Linens and towels for 8 guests
✓ Basic toiletries (shampoo, soap, TP)
✓ Kitchen basics (salt, pepper, oil, coffee filters)
✓ Paper towels and dish soap
✓ Laundry detergent

LOCAL RECOMMENDATIONS:
🎿 Bromley Mountain: 5 minutes (3987 VT Route 11)
🥾 Appalachian Trail Access: 10 minutes (Bromley trailhead)
🛒 Nearest Grocery: Shaw's Supermarket in Manchester (15 min)
🍕 Family Dining: Up For Breakfast, Mulligan's, The Copper Grouse

NEED HELP?
📱 Call/text: (555) 123-4567
📧 Email: info@aspiretowards.com

Have an amazing Vermont adventure!`,
        instantBook: false,
        publiclyVisible: true
    }
}

// Run the seed
seedBromleyProperty()
