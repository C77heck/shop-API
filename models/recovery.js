const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const recoverySchema = new Schema({
    requestId: { type: String, required: true },
    hint: { type: String, required: true },
    numberOfAttempts: { type: Number, required: true },
    requestDate: { type: Number, required: true },
    requestExpiry: { type: Number, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
})


module.exports = mongoose.model('Recovery', recoverySchema)