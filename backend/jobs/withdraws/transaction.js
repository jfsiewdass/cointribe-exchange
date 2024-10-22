const appRoot = require('app-root-path')
const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const { Queue } = require('bullmq')
const { v4: uuidv4 } = require('uuid')
const Redis = require('ioredis');
const coins = require(`${appRoot}/config/coins/info`)
const { Types } = require('mongoose');
const Web3 = require('web3')

let web3
// Create a Redis connection
const redis = new Redis('localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
});
const queueOptions = {
    connection: redis
  }

const _updateTransactionState = async (txHash, status, transactionId) => {
    console.log('_updateTransactionState');
    // console.log(tId, status, value, confirmations);
    const transaction = await Transaction.findById(transactionId);
    
    console.log(transaction);
    
    if (!transaction) {
      throw new Error('Transaction not found: _updateTransactionState' );
    }
    transaction.status = status;
    if (txHash) {
        transaction.txHash = txHash;
    }
    
    console.log('saved transaction');
    await transaction.save();
}

const sendTransaction = async (value, toAddress) => {
    console.log('sendTransaction');
    console.log(value, toAddress);
    
      try {
        const gasPrice = await web3.eth.getGasPrice()
        const gasPriceHex = web3.utils.toHex(gasPrice)
        const gasLimitHex = '0x5208'

        const nonce = await web3.eth.getTransactionCount(process.env.GENERATOR_ADDRESS)
        const transaction = {
            from: web3.utils.toChecksumAddress(process.env.GENERATOR_ADDRESS),
            nonce: web3.utils.toHex(nonce),
            gasPrice: gasPriceHex,
            gasLimit: gasLimitHex,
            to: web3.utils.toChecksumAddress(toAddress),
            value: web3.utils.toHex(web3.utils.toWei(`${value}`, 'ether'))
        }
        console.log(transaction, 'transaction');
        
        const signedTx = await web3.eth.accounts.signTransaction(
            transaction,
            process.env.GENERATOR_PRIVATE_KEY
        ).catch((error) => {
            console.log(error.toString());
        })
        const signed = await web3.eth.sendSignedTransaction(signedTx.rawTransaction).catch((error) => {
            console.log(error.toString());
            
        })
        console.log('Transacción enviada:', signed);
        return signed
    } catch (error) {
        throw 'error: not sendTransaction'
    }
}

const sendWithdraw
    = async ({ walletId, transactionId, amount, withdrawAddress }) => {
        console.log('sendWithdraw');
        
        const wallet = await Wallet.findById(walletId, { transactions: 0 })
        // console.log(wallet);
        
        if (wallet && 'coin' in wallet) {
            const { coin, chainId } = wallet
            // const value = (amount - coins[coin].fee) * 10 ** coins[coin].decimals // GWEI
            // console.log(coin, chainId, value);
            
            web3 = new Web3(require(`${appRoot}/config/chains/${chainId}`).rpc)
            const receipt = await sendTransaction(amount, withdrawAddress)
            console.log(receipt);
            
            if (receipt) {
                const { transactionHash, status } = receipt
                await _updateTransactionState(transactionHash, status ? 2 : 4, transactionId)
    
                const withdrawFrom = new Queue('WithdrawedFromCoinTribe', { ...queueOptions })
                withdrawFrom.add('withdraw', {
                    chainId,
                    amount,
                    withdrawAddress,
                    transactionHash,
                    transactionId,
                    status,
                    coin: wallet.coin
                }, {
                    attempts: 5,                      // number of attempts
                    backoff: {
                      type: 'fixed',                  // type of backoff
                      delay: 5000                     // delay between attempts
                    }
                  })
    
                return 'success'
            }
        }
    
        throw 'error: not processed: sendWithdraw'
    }

module.exports = sendWithdraw