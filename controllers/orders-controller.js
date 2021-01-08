const HttpError = require('../models/http-error');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const Order = require('../models/order');
const User = require('../models/user');

const { orderConfirmation } = require('../util/email');


const getOrders = async (req, res, next) => {
    const userId = req.params.pid;

    let user;
    try {
        user = await User.findById(userId)
    } catch (err) {
        console.log(err)
    }

    if (!user.status.isLoggedIn) {
        throw new HttpError('Sorry but something went wrong.', 403)
    }


    let orders;
    try {
        orders = await Order.find({ creator: userId })
    } catch (err) {
        console.log(err)
    }
    res.json({ orders: orders })
}

const createOrder = async (req, res, next) => {

    const { products,
        dateOrdered,
        dateToBeDelivered,
        totalPrice,
        numberOfItems,
        creator
    } = req.body;
    const errors = validationResult(req)
    console.log(errors)
    if (!errors.isEmpty()) {
        //   console.log(errors)
        return next(new HttpError(
            'Sorry but something went wrong and could not process your order',
            422
        ))
    }

    const createdOrder = new Order({
        products,
        dateOrdered,
        dateToBeDelivered,
        totalPrice,
        numberOfItems,
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
        session.startTransaction();
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

    try {
        const { email, fullName } = user;
        const date = dateToBeDelivered.slice(0, 10).replace(/-/g, '.')
        orderConfirmation(email, fullName.firstName, date);
    } catch (err) {

    }

    res.status(201).json({ order: createdOrder })

}

exports.createOrder = createOrder;
exports.getOrders = getOrders;
