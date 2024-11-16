const Web3 = require('web3');
const web3 = new Web3('https://api.avax-test.network/ext/bc/C/rpc'); // Usando WebSocket

// const Web3 = require('web3');

// Configurar el provider (por ejemplo, usando Infura)
// const web3 = new Web3('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

async function getWalletTransactions(address) {
  try {
    

    const isValidAddress = web3.utils.isAddress(address);
    console.log('Dirección válida:', isValidAddress);
    //let correctedAddress = '0x85513299341Fa1Aef01885dC2A5cB6d959C30A3d';

    // Obtener el número total de transacciones
    const transactionCount = await web3.eth.getTransactionCount(address);
    console.log(`Número total de transacciones: ${transactionCount}`);
    const fromBlock = '0x0'; // Primero bloque
    const toBlock = '0x' + BigInt(Math.floor(transactionCount / 50)).toString(16); 
    // Obtener las transacciones específicas de la wallet
    const topic = '0x8c5be3a143334eeb70f4dfdb499eb8574a84a768ff73fe77f1ae1346be0b996';
    const transactions = await web3.eth.getPastLogs({
      fromBlock: '0x0',
      toBlock: toBlock,
      address: address,
      topics: [topic]
    });

    return transactions;
  } catch (error) {
    console.error('Ocurrió un error:', error);
    throw error;
  }
}

// Ejemplo de uso
getWalletTransactions('0x85513299341Fa1Aef01885dC2A5cB6d959C30A3d')
  .then(transactions => {
    console.log('Transacciones:', transactions);
  })
  .catch(error => {
    console.error('Error al obtener las transacciones:', error);
  });

const abi = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "wallet",
          "type": "address"
        }
      ],
      "name": "WalletGenerated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "generate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
// Uso:
// getContractEvents(abi, '0x85513299341Fa1Aef01885dC2A5cB6d959C30A3d').then(events => {
// //   console.log(events);
// }).catch(error => {
//   console.error(error);
// });
