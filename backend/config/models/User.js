import mongoose, { Schema } from 'mongoose';

const userScheme = Schema({
    firstName: String,
    lastName: String,
    email: {
        type: String,
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    wallets: [{type: Schema.Types.ObjectId, ref: 'Wallet'}]
})
module.exports = mongoose.model('User', userScheme);