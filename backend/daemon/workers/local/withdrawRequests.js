const { Worker } = require('bullmq');
const redisClient = require('../config');

const worker = new Worker('withdraw-requests', async (job) => {
    console.log('Working...');
    console.log(job.data);
}, {
    connection: redisClient
});

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
});
worker.on('error', (err) => {
    console.error('Worker error:', err);
});