const appRoot = require('app-root-path')
require('dotenv').config({ path: `${appRoot}/config/.env` })
const { Queue } = require('bullmq')
const {Web3, WebSocketProvider} = require('web3')

const Wallet = require(`${appRoot}/config/models/Wallet`)
const { v4: uuidv4 } = require('uuid')

const connectDB = require(`${appRoot}/config/db/getMongoose`)

const getWeb3WssInstance = (wss) => {
    const provider = new WebSocketProvider(
        wss,
        {
            headers: {
                // to provide the API key if the Node requires the key to be inside the `headers` for example:
                //'x-api-key': '<Api key>',
            },
        },
        {
            delay: 500,
            autoReconnect: true,
            maxAttempts: 10,
        },
    );
    const web3 = new Web3(wss);
    return web3;
}

module.exports = {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
}
