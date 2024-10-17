const appRoot = require('app-root-path')
const { Types } = require('mongoose');
const Web3 = require('web3')
// const { sendDepositEmail } = require('../notifications/mailService')

const Transaction = require(`${appRoot}/config/models/Transaction`)
const Wallet = require(`${appRoot}/config/models/Wallet`)
const coins = require(`${appRoot}/config/coins/info`)
const User = require(`${appRoot}/config/models/User`)

let web3

const reject = () => {
    console.log('rejected');
    
    throw 'err: not deposited'
}

const _updateTransactionState = async (tId, status, value, confirmations) => {
    console.log('_updateTransactionState');
    // console.log(tId, status, value, confirmations);
    const transaction = await Transaction.findById(tId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }
    transaction.status = status;
    if (confirmations) {
      transaction.confirmations = confirmations;
    }
    if (value) {
      transaction.amount = value;
    }

    await transaction.save();
    // await Transaction.updateOne({ _id: Types.ObjectId(tId) }, {
    //     $set: upsert
    // })
}

const _deposit = async (transactionId, chainId, coin, address, value) => {
    console.log('_deposit');
    // console.log(transactionId, chainId, coin, address, value);
    var result = await Wallet.updateOne({
        address, coin, chainId
    }, {
        $inc: { balance: value }
    })
    
    if (result) {
        await _updateTransactionState(transactionId, 3, value) // 3 status PROCESADO
        const wallet = await Wallet.findOne({
            transactions: Types.ObjectId.createFromHexString(transactionId)
        })
        const user = await User.findOne({
            wallets: wallet._id
        });
        console.log(user);
        
        // sendDepositEmail(value, coin, user.email)
        return 'deposit'
    } else {
        await _updateTransactionState(transactionId, 4) // 4 status CANCELADO
        reject()
    }
}

const _checkConfirmation = async (
    address, txHash, value, coin, chainId, transactionId
) => {
    var result = await web3.eth.getTransactionReceipt(txHash)
    console.log('_checkConfirmation');
    // console.log(txHash, result);
    if (result && 'status' in result && result.status) {
        return _deposit(
            transactionId, chainId, coin, address, value / 10 ** coins[coin].decimals
        )
    }

    reject()
}

const processDeposit = async (
    { walletAddress, transactionHash, transactionId, chainId, coin }
) => {
    console.log('processDeposit function');
    console.log(walletAddress, transactionHash, transactionId, chainId, coin);
    
    
    web3 = new Web3(require(`${appRoot}/config/chains/${chainId}`).rpc)
    console.log('result');
    
    var result = await Transaction.findById(transactionId)

    if (result) {
        result = await web3.eth.getTransaction(transactionHash)
        console.log('processDeposit');
        
        if (result && 'value' in result) {
            const { value, blockNumber } = result
            const confirmations = (await web3.eth.getBlockNumber()) - blockNumber
            console.log('CONFIRMATIONS');
            console.log(confirmations);
            
            await _updateTransactionState(
                transactionId,
                2,// 2 status PROCESANDO
                value / 10 ** coins[coin].decimals, //se agregan 18 ceros con ** en el caso de avax 
                confirmations
            )
            if (confirmations >= process.env.MIN_CONFIRMATIONS) {
                // registrar
                return await _checkConfirmation(
                    walletAddress,
                    transactionHash,
                    value,
                    coin,
                    chainId,
                    transactionId
                )
            }

            reject()
        }
    }

    reject()
}

module.exports = processDeposit