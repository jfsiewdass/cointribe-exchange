const {
    redis,
    Worker,
    connectDB,
    createTransaction,
    processDeposit,
    // processWithdraw
} = require('./index')


connectDB.then(() => {
    new Worker('avax-transactions', async (job) => {
        try {
            await createTransaction(job.data)
        } catch(error) {
            job.moveToNextAttempt();
        }
    }, { connection: redis })

    new Worker('avax-deposits', async (job) => {
        try {
            return await processDeposit(job.data)
        } catch (error) {
            console.error('Error processing job:', error);
            job.moveToNextAttempt();
        }
        console.log('deposits');
    }, { connection: redis })

    // new Worker('avax-withdraws', async (job) => {
    //     return await processWithdraw(job.data)
    // })

})