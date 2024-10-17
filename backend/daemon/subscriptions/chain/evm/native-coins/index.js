const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const { Queue } = require('bullmq')
const Web3 = require('web3')

const Wallet = require(`${appRoot}/config/models/Wallet`)
const { v4: uuidv4 } = require('uuid')

const connectDB = require(`${appRoot}/config/db/getMongoose`)

const getWeb3WssInstance = (wss) => {
    return new Web3(new Web3.providers
        .WebsocketProvider(wss))
}
const Redis = require('ioredis');
const { connection } = require('mongoose')
// Create a Redis connection
const redis = new Redis('localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
const queueOptions = {
    connection: redis,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 500,
        },
    },
}
module.exports = {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance,
    queueOptions
}
