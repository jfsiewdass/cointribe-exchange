const {
    Queue,
    Wallet,
    uuidv4,
    connectDB,
    getWeb3WssInstance
} = require('./index')

const { default: Web3 } = require('web3');

const abi = [
    {
      "anonymous": false,
      "inputs": [],
      "name": "DepositedOnCoinTribe",
      "type": "event"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
]
const address = '0x85513299341Fa1Aef01885dC2A5cB6d959C30A3d';
const chainId = 43113
const coin = 'AVAX'

const transactionsQueue = new Queue('avax-transactions')

connectDB.then(async () => {
    const web3 = getWeb3WssInstance(process.env.AVALANCHE_WSS)
    const options = {
        topics: [
            web3.utils.sha3('DepositedOnCoinTribe()')
        ]
    };
    web3.eth.subscribe('logs', options, async (error, result) => {
        console.log(result, error);
        
        if (!error) {
            const wallets = await Wallet.find({chainId, coin})
            if (wallets) {
                const wallet = wallets.find(wallet => wallet.address === result.address)
                if (wallet) {
                    transactionsQueue.add('transaction', {
                        walletAddress: wallet.address,
                        transactionHash: result.transactionHash,
                        chainId: chainId,
                        coin: coin,
                        uuid: uuidv4()
                    }, {
                        attempts: 2,
                        backoff: {
                            type: 'exponencial',
                            delay: 5000
                        }
                    })
                }
            }
        }
       
    }).on('connected', (subscriptionId) => {
        console.log(`Suscripción conectada con ID ${subscriptionId}`);
    });
})