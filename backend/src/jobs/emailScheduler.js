const cron = require('node-cron')
const preStayEmailService = require('../services/preStayEmailService')

/**
 * Email Scheduler
 * Runs automated jobs for sending pre-stay and post-stay emails
 */
class EmailScheduler {
  constructor() {
    this.jobs = []
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    console.log('📅 Starting email scheduler...')

    // Pre-stay emails - Run daily at 9:00 AM
    const preStayJob = cron.schedule('0 9 * * *', async () => {
      console.log('🔄 Running pre-stay email job...')
      try {
        await preStayEmailService.processPreStayEmails()
      } catch (error) {
        console.error('❌ Error in pre-stay email job:', error)
      }
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust to your timezone
    })

    this.jobs.push({
      name: 'pre-stay-emails',
      schedule: '0 9 * * *',
      description: 'Send pre-stay emails daily at 9:00 AM',
      job: preStayJob
    })

    // Post-stay emails - Run daily at 10:00 AM
    // TODO: Implement post-stay email service
    /*
    const postStayJob = cron.schedule('0 10 * * *', async () => {
      console.log('🔄 Running post-stay email job...')
      try {
        await postStayEmailService.processPostStayEmails()
      } catch (error) {
        console.error('❌ Error in post-stay email job:', error)
      }
    }, {
      scheduled: true,
      timezone: "America/New_York"
    })

    this.jobs.push({
      name: 'post-stay-emails',
      schedule: '0 10 * * *',
      description: 'Send post-stay emails daily at 10:00 AM',
      job: postStayJob
    })
    */

    console.log(`✅ Started ${this.jobs.length} scheduled job(s)`)
    this.jobs.forEach(job => {
      console.log(`   - ${job.name}: ${job.description}`)
    })
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log('🛑 Stopping email scheduler...')
    this.jobs.forEach(job => {
      job.job.stop()
    })
    console.log('✅ All scheduled jobs stopped')
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return this.jobs.map(job => ({
      name: job.name,
      schedule: job.schedule,
      description: job.description,
      running: job.job.options.scheduled
    }))
  }

  /**
   * Manually trigger pre-stay email processing
   */
  async triggerPreStayEmails() {
    console.log('🔄 Manually triggering pre-stay emails...')
    return await preStayEmailService.processPreStayEmails()
  }
}

module.exports = new EmailScheduler()
