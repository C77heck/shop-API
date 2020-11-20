const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken')

const { validationResult } = require('express-validator');

const getCoordsForAddress = require('../util/location');


const HttpError = require('../models/http-error');
const User = require('../models/user')


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

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
        const error = new HttpError(
            'Invalid inputs passed, please check your data',
            422
        )
        return next(error)
    }

    const { fullName, email, password, phone, address } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        return next(new HttpError(
            'This user does not exist in the database',
            500
        ))
    }
    if (existingUser) {
        return next(new HttpError(
            'The email you entered, is already in use',
            500
        ))
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch (err) {

        return next(new HttpError(
            'Could not create user, please try again.',
            500
        ))
    }

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address)
        console.table(coordinates)
    } catch (error) {

        return next(error)
    }

    const createdUser = new User({
        fullName,
        email,
        password: hashedPassword,
        phone,
        address,
        location: coordinates
    })

    try {

        createdUser.save();

    } catch (err) {
        const error = new HttpError(' Signing up failed, please try again', 500)
        return next(error)

    }

    let token;
    try {

        token = jwt.sign({ userId: createdUser.id, email: createdUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    } catch (err) {

        return next(new HttpError(' Signing up failed, please try again', 500))
    }

    res
        .status(201)
        .json({ userLocation: createdUser.location, userId: createdUser.id, email: createdUser.email, token: token })

}



const signin = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed, please check your data', 422)
        return next(error)
    }

    const { email, password } = req.body;
    console.log(email + ' ' + password)
    let existingUser;

    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        return next(new HttpError(`Login failed, please try again later.`, 500))
    }

    if (!existingUser) {
        return next(new HttpError('Invalid credentials, please try again.', 401))
    }

    let isValidPassword = false;

    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        return next(new HttpError('Could not log you in, please check your credentials and try again', 500))
    }

    let token;
    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    } catch (err) {

        return next(new HttpError(' Signing in failed, please try again', 500))
    }

    res
        .json({
            message: 'Succesful login',
            userId: existingUser.id,
            email: existingUser.email,
            token: token
        })

}


exports.getUsers = getUsers;
exports.signup = signup;
exports.signin = signin;