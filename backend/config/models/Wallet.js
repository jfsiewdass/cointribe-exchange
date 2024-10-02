import mongoose, { Schema } from 'mongoose';

const walletScheme = Schema({
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    address: {
        type: String,
        required: true,
        index: true
    },
    coin: String,
    chainId: Number,
    transactions: [{type: Schema.Types.ObjectId, ref: 'Transaction'}]
})
module.exports = mongoose.model('Wallet', walletScheme);