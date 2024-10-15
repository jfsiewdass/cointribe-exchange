const {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
} = require('./index')

connectDB.then(async () => {
    const web3 = getWeb3WssInstance(process.env.BSC_WSS)
    const options = {
        topics: [
            web3.utils.sha3('DepositedOnMetaDapp()')
        ]
    };

    web3.eth.subscribe('logs', options, async (error, result) => {
        console.log(result, error);
       
    }).on('connected', (subscriptionId) => {
        console.log(`Suscripción conectada con ID ${subscriptionId}`);
    });
})