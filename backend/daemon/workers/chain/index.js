const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const { Worker } = require('bullmq')
const createTransaction = require(`${appRoot}/jobs/deposits/transaction`)
const processDeposit = require(`${appRoot}/jobs/deposits/deposit`)
// const processWithdraw = require(`${appRoot}/jobs/withdraws/withdraw`)
const connectDB = require(`${appRoot}/config/db/getMongoose`);
const Redis = require('ioredis');
// Create a Redis connection
const redis = new Redis('localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
module.exports = {
    redis,
    Worker,
    connectDB,
    createTransaction,
    processDeposit,
    // processWithdraw
}