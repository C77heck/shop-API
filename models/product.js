const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: { type: String, required: true },
    unit: { type: String, required: true },
    price: { type: String, required: true },
    code: { type: Number, required: true },
    image: { type: String, required: true }
})


module.exports = mongoose.model('Product', productSchema)