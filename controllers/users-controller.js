const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken')

const { validationResult } = require('express-validator');

const getCoordsForAddress = require('../util/location');

const { recoveryMessage } = require('../util/email');

const HttpError = require('../models/http-error');
const User = require('../models/user');



const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError(
            'Invalid inputs passed, please check your data',
            422
        )
        return next(error)
    }

    const { fullName, email, password, phone, address, hint, answer } = req.body;

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
    } catch (error) {

        return next(error)
    }

    const createdUser = new User({
        fullName: {
            firstName: fullName.firstName,
            lastName: fullName.lastName
        },
        email,
        password: hashedPassword,
        phone,
        address: {
            city: address.city,
            street: address.street,
            postCode: address.postCode,
            houseNumber: address.houseNumber
        },
        location: coordinates,
        instructions: '',
        orders: [],
        hint,
        answer

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
        .json({
            userLocation: createdUser.location,
            userId: createdUser.id, email: createdUser.email,
            token: token
        })

}



const signin = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed, please check your data', 422)
        return next(error)
    }

    const { email, password } = req.body;
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
            token: token,
        })

}

const updateUserData = async (req, res, next) => {
    const userId = req.params.pid;
    const {
        fullName,
        email,
        phone,
        address,
        instructions,
        hint,
        answer
    } = req.body;

    let user;
    try {
        user = await User.findById(userId)
    } catch (err) {
        return next(new HttpError(err, 500))
    }

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address)
    } catch (error) {

        return next(error)
    }


    if (user !== null) {
        try {
            user.fullName = fullName;
            user.email = email;
            user.phone = phone;
            user.address = address;
            user.location = coordinates;
            user.instructions = instructions;
            user.hint = hint;
            user.answer = answer
            await user.save();
        } catch (err) {
            return next(new HttpError(err, 500))

        }
    } else {
        console.log(`user was not found by the user id of ${userId}`)
    }

    res.status(201).json({ userData: user })
}

const addDeliveryInstructions = async (req, res, next) => {
    const { instructions, userId } = req.body;
    let existingUser;
    try {
        existingUser = await User.findById(userId)
    } catch (err) {
        return next(new HttpError(err, 500))
    }
    try {
        existingUser.instructions = instructions;
        await existingUser.save();
    } catch (err) {
        return next(new HttpError(err, 500))
    }

    res.json({ instructions: instructions })
}


const getUserInfo = async (req, res, next) => {
    const userId = req.params.pid;
    let user;
    try {
        user = await User.findById(userId)
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, could not find user',
            500))
    }

    res.json({ userData: user })

}


const passwordRecovery = async (req, res, next) => {

    const { email } = req.body;

    let user;
    try {
        user = await User.find({ email: email })
    } catch (err) {
        return next(new HttpError(
            'This email address is not associated'
            +
            ' with any of the accounts in our database! Please'
            +
            'check your email address and try again'
            , 400)
        )
    }

    if (user) {
        try {
            recoveryMessage(email, user[0].id, user[0].fullName.firstName)
        } catch (err) {

        }

    }

    res.status(201);
}

const PasswordReset = async (req, res, next) => {

    const { answer, password } = req.body;

    const userId = req.params.pid;

    let user;
    try {
        user = await User.findById(userId)
    } catch (err) {
        return next(new HttpError(err, 500))
    }

    try {
        if (user.answer === answer) {
            user.password = password;
        }
        await user.save();
    } catch (err) {
        return next(new HttpError(err, 500))
    }

    res.status(201);
}

exports.signup = signup;
exports.signin = signin;
exports.addDeliveryInstructions = addDeliveryInstructions;
exports.getUserInfo = getUserInfo;
exports.updateUserData = updateUserData;
exports.passwordRecovery = passwordRecovery;
exports.PasswordReset = PasswordReset;
