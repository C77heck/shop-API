const axios = require('axios');
const HttpError = require('../models/http-error');


async function getCoordsForAddress(address) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
        )}&key=${process.env.GOOGLE_API_KEY}`;
    const response = await axios.get(url);

    const data = response.data;
    if (!data || data.status === "ZERO_RESULTS") {
        const error = new HttpError(
            "Could not find location for the specified address.",
            422
        );
        throw error;
    }
    //const coordinates = data.results[0].geometry.location;
    const coordinates = {
        lat: 40.7477499,
        lng: 73.9850813
    }
    return coordinates;
}

module.exports = getCoordsForAddress;

