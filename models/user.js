const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  instructions: { type: String },
  orders: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Order' }]

});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);