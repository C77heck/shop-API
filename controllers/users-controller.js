const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken')

const { validationResult } = require('express-validator');

const getCoordsForAddress = require('../util/location');

const { recoveryMessage } = require('../util/email');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Recovery = require('../models/recovery');







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
        answer: answer.trim(),
        status: {
            isLoggedIn: true,
            isBlocked: false,
            loginAttempts: 0,
            passwordRequest: false
        }
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
    if (existingUser.status.loginAttempts > 4) {
        try {
            const requestDate = new Date();
            const requestExpiry = new Date(new Date().getTime() + 1000 * 60 * 60);
            const requestId = uuidv4()
            const newRequest = new Recovery({
                requestId: requestId,
                numberOfAttempts: 0,
                hint: existingUser.hint,
                requestDate: requestDate,
                requestExpiry: requestExpiry,
                creator: existingUser._id
            })
            newRequest.save();
            recoveryMessage(email, requestId, existingUser.fullName.firstName)

            throw new HttpError()
        } catch (err) {
            return next(new HttpError(
                'You have entered incorrect password 5 times.'
                +
                ' we have sent a password recovery link to your email address.',
                500
            ))
        }
    }
    let isValidPassword = false;

    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        return next(new HttpError(
            'Could not log you in, please check your credentials and try again',
            500
        ))
    }

    if (!isValidPassword) {

        existingUser.status.loginAttempts += 1;
        existingUser.save();
        return next(new HttpError(
            'Could not log you in, please check your credentials and try again',
            500
        ))
    } else {
        existingUser.status.passwordRequest = 0;
        existingUser.status.isLoggedIn = true;

        existingUser.save();
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



const signout = async (req, res, next) => {

    const userId = req.params.pid;
    console.log(req.params.pid)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed, please check your data', 422)
        return next(error)
    }

    let user;

    try {
        user = await User.findById(userId)
    } catch (err) {
        console.log(err)
    }

    try {
        user.status.loginAttempts = 0;
        user.status.isLoggedIn = false;
        await user.save();
    } catch (err) {
        console.log(err)
    }
    console.log(user)

    res.status(201)
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

    let user;
    try {
        user = await User.findById(userId)
    } catch (err) {
        return next(new HttpError('something is wrong', 500))
    }
    try {
        user.instructions = instructions;
        await user.save();
    } catch (err) {
        return next(new HttpError('what is going on', 500))
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

    
    if (!user.status.isLoggedIn) {
        throw new HttpError('Sorry but something went wrong.', 403)
    }
    

    res.json({ userData: user })
}

const getUserHint = async (req, res, next) => {
    const userId = req.params.pid;
    let user;
    try {
        user = await User.findById(userId)
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, could not find user',
            500))
    }

    if (!user.status.isLoggedIn) {
        throw new HttpError('Sorry but something went wrong.', 403)
    }

    res.json({ hint: user.hint })
}


exports.signup = signup;
exports.signin = signin;
exports.signout = signout;
exports.addDeliveryInstructions = addDeliveryInstructions;
exports.getUserInfo = getUserInfo;
exports.getUserHint = getUserHint;
exports.updateUserData = updateUserData;
