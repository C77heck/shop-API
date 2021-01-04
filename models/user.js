const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullName: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true }
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  address: {
    city: { type: String, required: true },
    street: { type: String, required: true },
    postCode: { type: String, required: true },
    houseNumber: { type: String, required: true }
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  instructions: { type: String },
  orders: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Order' }],
  hint: { type: String, required: true },
  answer: { type: String, required: true },
  status: {
    isBlocked: { type: Boolean, required: true },
    dateUntilBlocked: { type: String },
    unblockTimer: { type: Number }
  }

});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);