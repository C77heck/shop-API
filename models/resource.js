const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const resourceSchema = new Schema({
    name: { type: String, required: true },
    resourcePlace: { type: String, required: true },
    image: { type: String, required: true }

});


module.exports = mongoose.model('Resource', resourceSchema);