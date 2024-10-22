const appRoot = require('app-root-path')
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { Queue } = require('bullmq')
const { v4: uuidv4 } = require('uuid')
const Redis = require('ioredis');
const { connection } = require('mongoose')
// Create a Redis connection
const redis = new Redis('localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
const queueOptions = {
    connection: redis,
    // defaultJobOptions: {
    //   attempts: 40,
    //   backoff: {
    //     type: 'exponential',
    //     delay: 2000,
    //   },
    // },
  }
const createTransaction
    = async ({ walletAddress, transactionHash, chainId, coin }) => {
        const transaction = new Transaction({
            nature: 1,
            created_at: Date.now(),
            txHash: transactionHash
        })

        var result = await transaction.save()
        if (result) {
            result = await Wallet.updateOne({
                address: walletAddress,
                chainId,
                coin: coin.toUpperCase()
            }, {
                $push: {
                    transactions: transaction
                }
            })

            if (result) {
                const depositsQueue = new Queue(`${coin.toLowerCase()}-deposits`, { ...queueOptions })
                console.log('createTransaction');
                
                depositsQueue.add('deposit', {
                    walletAddress,
                    transactionHash,
                    chainId,
                    coin,
                    transactionId: transaction._id.toString(),
                    uuid: uuidv4()
                }, {
                    attempts: 40,                      // number of attempts
                    backoff: {
                      type: 'exponential',                  // type of backoff
                      delay: 5000                     // delay between attempts
                    }
                  })
            }

            return 'deposit'
        }

        throw 'err: not processed'
    }

module.exports = createTransaction