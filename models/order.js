const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    products: { type: String, required: true },
    dateOrdered: { type: String, required: true },
    dateToBeDelivered: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
})


module.exports = mongoose.model('Order', orderSchema)