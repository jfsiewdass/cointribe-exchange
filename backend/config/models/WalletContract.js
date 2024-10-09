
const mongoose = require('mongoose')
const walletContractScheme = mongoose.Schema({
    address: {
        type: String,
        unique: true,
        required: true,
    },
    reserved: {
        type: Boolean,
        default: false
    },
    chainId: Number,
})
module.exports = mongoose.model('WalletContract', walletContractScheme);