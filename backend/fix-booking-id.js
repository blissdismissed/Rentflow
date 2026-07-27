require('dotenv').config();
const { sequelize } = require('./src/config/database');
sequelize.query('ALTER TABLE "guest_stays" ALTER COLUMN "bookingId" DROP NOT NULL')
  .then(() => { console.log('Done! bookingId is now nullable.'); process.exit(0); })
  .catch(e => { console.error('Error:', e.message); process.exit(1); });
