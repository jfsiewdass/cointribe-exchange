const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const connectDB = require(`${appRoot}/config/db/getMongoose`);
const { Worker } = require('bullmq');
const sendWithdraw = require(`${appRoot}/jobs/withdraws/transaction`)
const Redis = require('ioredis');
// Create a Redis connection
const redis = new Redis('localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
module.exports = {
  redis,
  connectDB,
  Worker,
  sendWithdraw
}
