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
    console.log(data.results[0].plus_code.global_code)
    const coordinates = data.results[0].geometry.location;

    return coordinates;
}

module.exports = getCoordsForAddress;

