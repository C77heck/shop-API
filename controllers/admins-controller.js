/* const bcrypt = require('bcryptjs');


const { validationResult } = require('express-validator');

const { notifyingEmailToAdmin } = require('../util/email');
const HttpError = require('../models/http-error');
const Admin = require('../models/admin');
const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product');

const getProduct = async (req, res, next) => {
    const code = req.params.pid;

    let product;
    try {
        product = await Product.findOne({ code: code })
        if (product === null) {
            throw new HttpError();
        }
    } catch (err) {
        return next(new HttpError(
            'The product code is not in our database.',
            404))
    }

    res.status(201).json({ product: product })

}



const getOrders = async (req, res, next) => {
    let orders;
    try {
        orders = await Order.find();
    } catch (err) {
        return next(new HttpError(
            err,
            422
        ))
    }
    let user;
    try {
        user = await User.find({ ObjectId: orders.creator });

    } catch (err) {
        return next(new HttpError(
            'Something went wrong',
            500
        ))
    }
    res.json({ orders: orders, user: user })
}


const getUsers = async (req, res, next) => {
    const { email, name } = req.body;
    let users;
    try {
        users = await User.find({}, '-password')
    } catch (err) {
        console.log(err)
    }

    res.json({ users: users.map(u => u.toObject({ getters: true })) })
}


const adminSignin = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed, please check your data', 422)
        return next(error)
    }

    const { accountID, password } = req.body;
    let existingAdmin;
    console.log(accountID, password)
    try {
        existingAdmin = await Admin.findOne({ accountID: accountID })
    } catch (err) {
        return next(new HttpError(`Invalid credentials, please try again.`, 401))
    }

    if (!existingAdmin) {
        return next(new HttpError(`Invalid credentials, please try again.${existingAdmin}`, 401))
    }


    if (existingAdmin.status.loginAttempts > 2) {
        try {
            const requestDate = new Date();
            const requestExpiry = new Date(new Date().getTime() + 1000 * 60 * 60);

            existingAdmin.status.isBlocked = true;
            existingAdmin.save();

            notifyingEmailToAdmin(existingAdmin.email, existingAdmin.fullName.firstName)

            throw new HttpError()
        } catch (err) {
            return next(new HttpError(
                'You have entered incorrect password 3 times.'
                +
                'This account has been blocked for security reasons.',
                403
            ))
        }
    }

    let isValidPassword = false;

    try {

        isValidPassword = password === existingAdmin.password ? true : false;
        // isValidPassword = await bcrypt.compare(password, existingAdmin.password)
    } catch (err) {
        return next(new HttpError('Could not log you in, please check your credentials and try again', 500))
    }



    if (!isValidPassword) {

        existingAdmin.status.loginAttempts += 1;
        existingAdmin.save();
        return next(new HttpError(
            'Could not log you in, please check your credentials and try again',
            500
        ))
    } else {
        existingAdmin.status.passwordRequest = 0;
        existingAdmin.status.isLoggedIn = true;
        existingAdmin.save();
    }



    res
        .json({
            message: 'Succesful login',
            userId: existingAdmin.id,
            isAdmin: existingAdmin.isAdmin
        })

}


exports.getUsers = getUsers;
//exports.adminSignup = adminSignup;
exports.adminSignin = adminSignin;
exports.getOrders = getOrders;
exports.getProduct = getProduct; */