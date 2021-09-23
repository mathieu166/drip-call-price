import dotenv from 'dotenv'
dotenv.config()

import cron from 'node-cron'
import JobUpdateDripPrices from './jobs/job-update-drip-prices.js'

const job = new JobUpdateDripPrices()
job.run()
