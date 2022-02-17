const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken')

const { validationResult } = require('express-validator');

const getCoordsForAddress = require('../util/location');

const { recoveryMessage, contactEmail } = require('../util/email');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Recovery = require('../models/recovery');

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(
            `Invalid inputs passed, please check your data`,
            422
        ))
    }
    const {
        firstName,
        lastName,
        email,
        password,
        phone,
        city,
        street,
        postCode,
        houseNumber,
        hint,
        answer
    } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        return next(new HttpError(
            'This user does not exist in our database',
            503
        ))
    }
    if (existingUser) {
        return next(new HttpError(
            'The email you entered, is already in use',
            400
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
        coordinates = await getCoordsForAddress({
            city: city,
            street: street,
            postCode: postCode,
            houseNumber: houseNumber
        })
    } catch (error) {

        return next(error)
    }

    const createdUser = new User({
        fullName: {
            firstName: firstName,
            lastName: lastName
        },
        email,
        password: hashedPassword,
        phone,
        address: {
            city: city,
            street: street,
            postCode: postCode,
            houseNumber: houseNumber
        },
        location: coordinates,
        instructions: '',
        orders: [],
        favourites: [],
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

        return next(new HttpError(
            'Signing up failed, please try again',
            500
        ))
    }

    let token;
    try {

        token = jwt.sign({ userId: createdUser.id, email: createdUser.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    } catch (err) {

        return next(new HttpError(
            ' Signing up failed, please try again',
            500
        ))
    }

    res
        .status(201)
        .json({

            userData: {
                userLocation: createdUser.location,
                userId: createdUser.id,
                token: token,
            }
        })

}



const signin = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError(
            'Invalid inputs passed, please check your data',
            503
        ))
    }

    const { email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        return next(new HttpError(
            `Login failed, please try again later.`,
            500
        ))
    }

    if (!existingUser) {
        return next(new HttpError(
            'Invalid credentials, please try again.',
            401
        ))
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
                401
            ))
        }
    }
    let isValidPassword = false;

    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password)
    } catch (err) {
        return next(new HttpError(
            'Could not log you in, please check your credentials and try again',
            401
        ))
    }

    if (!isValidPassword) {

        existingUser.status.loginAttempts += 1;
        existingUser.save();
        return next(new HttpError(
            'Could not log you in, please check your credentials and try again',
            401
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

        return next(new HttpError(
            ' Signing in failed, please try again',
            500
        ))
    }

    res.json({
        userData: {
            userId: existingUser.id,
            token: token,
            favourites: existingUser.favourites
        }
    })
}

const signout = async (req, res, next) => {
    const userId = req.params.pid;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError(
            'Invalid inputs passed, please check your data',
            422
        ))
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
        answer
    } = req.body;

    let user;
    try {
        user = await User.findById(userId)
    } catch (err) {
        return next(new HttpError(
            'Something went wrong on our side. Please try again later',
            500
        ))
    }

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address)
    } catch (error) {

        return next(error)
    }

    try {
        if (user.answer !== answer) {
            throw new HttpError()
        }
    } catch (err) {
        return next(new HttpError('Incorrect answer!', 401))
    }

    if (user !== null) {
        try {
            user.fullName = fullName;
            user.email = email;
            user.phone = phone;
            user.address = address;
            user.location = coordinates;
            user.instructions = instructions;
            await user.save();
        } catch (err) {
            return next(
                new HttpError(
                    'Something went wrong, please try again later.',
                    500
                ))

        }
    } else {
        console.log(`user was not found by the user id of ${userId}`)
    }

    res.status(201).json({ message: 'User info has been updated!' })
}

const addDeliveryInstructions = async (req, res, next) => {
    const { instructions, userId } = req.body;

    let user;
    try {
        user = await User.findById(userId)
    } catch (err) {
        return next(new HttpError(
            'Something went wrong on our side. Please try again later',
            500
        ))
    }
    try {
        user.instructions = instructions;
        await user.save();
    } catch (err) {
        return next(new HttpError(
            'Something went wrong on our side. Please try again later',
            500
        ))
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

    try {
        if (!user.status.isLoggedIn) {
            throw new HttpError(
                'Sorry but something went wrong.',
                403
            )
        }
    } catch (err) {

        return next(new HttpError(err))
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
            500
        ))
    }
    try {
        if (!user.status.isLoggedIn) {
            throw new HttpError(
                'Sorry but something went wrong.',
                403)
        }
    } catch (err) {

        return next(new HttpError(err))

    }


    res.json({ hint: user.hint })
}

const favouritesHandler = async (req, res, next) => {
    const userId = req.params.pid;
    const { productId } = req.body;

    let user;
    try {
        user = await User.findById(userId);
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, could not find user',
            404))
    }

    try {
        if (user.favourites.includes(productId)) {
            user.favourites.pull(productId);
        } else {
            user.favourites.push(productId);
        }
        user.save();
    } catch (err) {
        return next(new HttpError(
            'Something went wrong on our side. Please try again later',
            500
        ))
    }
    res.json({ message: 'succesfully added to your favourites' })
}

const contact = (req, res, next) => {
    const { name, email, message } = req.body;

    try {
        contactEmail(name, email, message)
    } catch (err) {
        return next(new HttpError(
            'Sorry something went wrong, please try again later'
            , 503
        ))
    }
    
    res.json({ message: 'Thank you for getting in touch. we will respond as soon as we can.' })
}


exports.signup = signup;
exports.signin = signin;
exports.signout = signout;
exports.addDeliveryInstructions = addDeliveryInstructions;
exports.getUserInfo = getUserInfo;
exports.getUserHint = getUserHint;
exports.updateUserData = updateUserData;
exports.favouritesHandler = favouritesHandler;
exports.contact = contact;
