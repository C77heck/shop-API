const { validationResult } = require('express-validator');

const HttpError = require("../models/http-error");

const Admin = require('../models/admin');
const Resource = require('../models/resource')

//send over image paths(carousel)
const getImages = async (req, res, next) => {

    const resourcePlace = req.params.pid;

    let images;
    try {
        images = await Resource.find({ resourcePlace: resourcePlace })
    } catch (err) {
        return next(new HttpError(
            'Sorry something went wrong.',
            500
        ))
    }

    res.json({ images: images })
}

//new resource creation.
const imageUpload = async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(new HttpError(
            'Invalid inputs passed, please check your data',
            503
        ))
    }

    const adminId = req.params.pid;
    const { name, resourcePlace } = req.body;


    let admin;
    try {
        admin = await Admin.findById(adminId)
    } catch (err) {
        return next(new HttpError(
            'Authentication failed. Please check your credentials and try again.',
            401
        ))
    }

    const newImage = new Resource({
        name,
        resourcePlace,
        image: req.file.path
    })

    try {
        newImage.save();
    } catch (err) {
        return next(new HttpError(
            'Sorry something went wrong. Please try again later',
            500
        ))
    }

    res.status(201).json({ message: 'The resource has been added.' })


}


exports.getImages = getImages;
exports.imageUpload = imageUpload;
