const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const { Worker, Queue } = require('bullmq')
const { v4: uuidv4 } = require('uuid')
const connectDB = require(`${appRoot}/config/db/getMongoose`)
const Redis = require('ioredis');
// Create a Redis connection
const redis = new Redis('localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
const queueOptions = {
    connection: redis
}
connectDB.then(() => {
    new Worker('WithdrawedFromCoinTribe', async (job) => {
        console.log('WithdrawedFromCoinTribe');
        
        try {
            const { withdrawAddress, transactionHash, transactionId, amount, coin, chainId } = job.data
            const withDrawQueue = new Queue(`${coin.toLowerCase()}-withdraws`, queueOptions)
            withDrawQueue.add('withdraw', {
                walletAddress: withdrawAddress,
                transactionHash,
                coin,
                transactionId,
                chainId,
                amount,
                uuid: uuidv4()
            }, {
                attempts: 20,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                }
            })

            return 'success'
        } catch(error) {
            job.moveToNextAttempt();
        }
        
    }, { ...queueOptions })
})