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
      "name": "DepositedOnMetaDapp",
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
    // const web3 = getWeb3WssInstance(process.env.AVALANCHE_WSS)
    const web3 = new Web3(process.env.AVALANCHE_WSS)
    const options = {
        fromBlock: 0,
        toBlock: 'latest',
        address: '0x4d56d7c17295bAe224270C4C6d76EdbB83d6879b',
        //topics: [
            //web3.utils.sha3('DepositedOnMetaDapp()')
        //]
    };
    const contract = new web3.eth.Contract(abi, address);

     const txcount = await web3.eth.getTransactionCount(address)
    console.log('transactions', txcount)    
    console.log('conectado a mongo...');

    // GET PAST LOGS
   
    // web3.eth.getPastLogs(options)
    // .then((logs) => {
    //   console.log(logs);
    // })
    // .catch((error) => {
    //   console.error('Error retrieving logs:', error);
    // });


    // GET PAST EVENTS
    // web3.getPastEvents('allEvents',{  }, (error, event) => {
    //     if (error) {
    //         console.error("Error:", error);
    //         return;
    //     }
    
    //     console.log("New event received:");
    //     console.log(event.returnValues);
    // })
    // .on("connected", () => {
    //     console.log("Connected to the blockchain");
    // })
    // .on("changed", (event) => {
    //     console.log("Event changed:", event.returnValues);
    // })
    // .on("error", (error) => {
    //     console.error("Event error:", error);
    // }); 
    const transaction = contract.events.allEvents(options); 

    transaction.on('connected', function (subId) {
        console.log("conectado", subId);
    })
    transaction.on('data', function (error, result) {
        console.log(error, result);
    })
    // SUBSCRIBE VERSION 1.0.0
    // web3.eth.subscribe('logs', {
    //     address: null, // Suscribir a todos los contratos
    //     topics: [], // No filtrar por temas específicos
    // }, async (error, result) => {
    //     console.log(result, error);
       
    // }).on('connected', (subscriptionId) => {
    //     console.log(`Suscripción conectada con ID ${subscriptionId}`);
    // });

    // ALL EVENTS
    // async function subscribe() {
    //     console.log('subscribiendo...');
        
    //     const contract = new web3.eth.Contract(abi, address);
    
    //     // subscribe to the smart contract Transfer event
    //     const subscription =  contract.events.allEvents({ topics: [] }, (error, event) => {
    //         if (error) {
    //             console.error("Error:", error);
    //             return;
    //         }
        
    //         console.log("New event received:");
    //         console.log(event.returnValues);
    //     })
    //     .on("connected", () => {
    //         console.log("Connected to the blockchain");
    //     })
        
    //     console.log("End of routine");
    
    //     return subscription;
    //   }
    //   subscribe()
})