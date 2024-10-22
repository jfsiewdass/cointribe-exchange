const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const { redis, connectDB, Worker, sendWithdraw } = require('../config')

connectDB.then(() => {
    new Worker('withdraw-requests', async (job) => {
        try{
            console.log('Working...');
            console.log(job.data);
            return await sendWithdraw(job.data)
        } catch(error) {
            job.moveToNextAttempt();
        }
    }, { connection: redis });
})