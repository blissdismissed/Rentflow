const cron = require('node-cron')
const { syncAllSources } = require('../services/icalService')

class IcalSyncJob {
  constructor() {
    this.jobs = []
  }

  start() {
    console.log('📅 Starting iCal sync job...')

    const syncJob = cron.schedule('*/20 * * * *', async () => {
      console.log('🔄 Running iCal channel sync...')
      try {
        const results = await syncAllSources()
        const errors = results.filter(r => r.status === 'error')
        const added = results.reduce((n, r) => n + (r.added || 0), 0)
        if (errors.length) {
          console.warn(`⚠️  iCal sync: ${added} new blocks, ${errors.length} source(s) failed`)
        } else {
          console.log(`✅ iCal sync complete: ${added} new block(s) across ${results.length} source(s)`)
        }
      } catch (err) {
        console.error('❌ iCal sync job error:', err)
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    })

    this.jobs.push(syncJob)
  }

  stop() {
    this.jobs.forEach(j => j.stop())
    this.jobs = []
    console.log('🛑 iCal sync job stopped')
  }
}

module.exports = new IcalSyncJob()
