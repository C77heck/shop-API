const HttpError = require('../models/http-error');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const Order = require('../models/order');
const User = require('../models/user');


const createOrder = async (req, res, next) => {

    const { products, dateOrdered, dateToBeDelivered, creator } = req.body;
    const errors = validationResult(req)
    console.log(errors)
    if (!errors.isEmpty()) {
        return next(new HttpError(
            'Sorry but something went wrong and could not process your order',
            422
        ))
    }

    const createdOrder = new Order({
        products,
        dateOrdered,
        dateToBeDelivered,
        creator
    })

    let user;
    try {
        user = await User.findById(creator)
    } catch (err) {
        return next(new HttpError(
            'Could not find user for provided id',
            500
        ))
    }

    try {
        const session = await mongoose.startSession();
        session.withTransaction();
        createdOrder.save(session);
        user.orders.push(createdOrder)
        await user.save(session)
        session.commitTransaction();
    } catch (err) {
        return next(new HttpError(
            err,
            422
        ))

    }

    res.status(201).json({ order: createdOrder })

}

exports.createOrder = createOrder;
