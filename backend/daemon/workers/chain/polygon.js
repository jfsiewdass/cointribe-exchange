const {
    redis,
    Worker,
    connectDB,
    createTransaction,
    processDeposit,
    processWithdraw
} = require('./index')


connectDB.then(() => {
    new Worker('matic-transactions', async (job) => {
        try {
            await createTransaction(job.data)
        } catch(error) {
            job.moveToNextAttempt();
        }
    }, { connection: redis })

    new Worker('matic-deposits', async (job) => {
        try {
            return await processDeposit(job.data)
        } catch (error) {
            console.error('Error processing job:', error);
            job.moveToNextAttempt();
        }
        console.log('deposits');
    }, { connection: redis })

    new Worker('matic-withdraws', async (job) => {
        try {
            await processWithdraw(job.data)
        } catch(error) {
            job.moveToNextAttempt();
        }
        return 'withdrawed'
    }, { connection: redis })

})