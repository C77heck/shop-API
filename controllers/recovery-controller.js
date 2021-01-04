const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const { recoveryMessage } = require('../util/email');
const getUnblockDate = require('../util/date');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Recovery = require('../models/recovery');



const getHint = async (req, res, next) => {

    const requestId = req.params.pid;

    let request;
    console.log(getUnblockDate())
    try {
        request = await Recovery.find({ requestId: requestId })
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, please try reloading the page',
            404
        ))
    }

    if (request.length < 1) {
        return next(new HttpError(
            'Sorry but this link is no longer valid! Either check your inbox '
            +
            'for a newer link or kindly request a new one.',
            404
        ))
    }

    res.json({ request: request[0].hint })
}

const passwordRecovery = async (req, res, next) => {

    const { email } = req.body;

    console.log(getUnblockDate(), 'check  this one')


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


    try {
        if (user[0].status.unblockTimer > new Date().getTime()) {
            console.log(user[0].status.dateUntilBlocked, user[0].status.unblockTimer)

            throw new HttpError()

        }
    } catch (err) {
        return next(new HttpError(
            'Sorry but your account has been blocked for security reasons'
            +
            ` until ${user[0].status.dateUntilBlocked}`,
            504
        )
        )
    }

    let existingRequest;
    try {
        existingRequest = await Recovery.find({ creator: user[0]._id })
    } catch (err) {
        console.log(err)
    }
    if (existingRequest.length > 0) {

        try {
            await Recovery.deleteMany({ creator: user[0]._id })
        } catch (err) {
            console.log(err)
        }
    }
    try {

        const requestId = uuidv4()
        const newRequest = new Recovery({
            requestId: requestId,
            numberOfAttempts: 0,
            hint: user[0].hint,
            requestDate: new Date(),
            creator: user[0]._id
        })
        newRequest.save();
        recoveryMessage(email, requestId, user[0].fullName.firstName)

    } catch (err) {
        return next(new HttpError(
            'Something went wrong, please try again later.',
            500)
        )
    }

    res.status(201);
}

const PasswordReset = async (req, res, next) => {

    const { answer, password } = req.body;

    const requestId = req.params.pid;

    let request;
    try {
        request = await Recovery.find({ requestId: requestId })
    } catch (err) {
        return next(new HttpError(
            'Could not update your password, please try again.',
            400
        ))
    }

    let user;
    try {
        user = await User.findById(request[0].creator)
    } catch (err) {
        return next(new HttpError('whaat?', 500))
    }

    if (request[0].numberOfAttempts > 4) {


        user.status.isBlocked = true;
        user.status.dateUntilBlocked = getUnblockDate().toString().slice(0, 21);
        user.status.unblockTimer = Date.parse(new Date(new Date().getTime() + 1000 * 60 * 60 * 24));
        user.save();
        return next(new HttpError(
            'You have failed to answer the security question 5 times'
            +
            ' in a row. Your account has been blocked for 24 hours.',
            500
        ))
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12)
    } catch (err) {

        return next(new HttpError(
            'Could not update your password, please try again.',
            500
        ))
    }

    try {
        if (user.answer === answer) {

            user.password = hashedPassword;
            user.status.loginAttempts = 0;
            await user.save();
        } else {
            request[0].numberOfAttempts += 1;
            request[0].save();
            throw new Error();
        }
    } catch (err) {
        return next(new HttpError(
            'The answer you gave does not match the one in our database',
            500
        ))

    }


    try {
        await Recovery.deleteMany({ creator: user._id })
    } catch (err) {
        console.log('did not work...')
    }


    res.status(201).json({ response: 'it got done' });
}

exports.getHint = getHint;
exports.passwordRecovery = passwordRecovery;
exports.PasswordReset = PasswordReset