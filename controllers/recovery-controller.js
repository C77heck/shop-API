/* const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const { recoveryMessage } = require('../util/email');
const { getUnblockDate, getUnblockTimer } = require('../util/date');

const HttpError = require('../models/http-error');
const User = require('../models/user');
const Recovery = require('../models/recovery');


const notMe = async (req, res, next) => {

    const requestId = req.params.pid;

    let request;
    try {
        request = await Recovery.findOne({ requestId: requestId })
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, please try reloading the page',
            404
        ))
    }

    let user;
    try {
        user = await User.findById(request.creator)

    } catch (err) {
        return next(new HttpError(
            err,
            404
        ))
    }

    try {
        user.status.isBlocked = true;
        user.status.dateUntilBlocked = getUnblockDate().toString().slice(0, 21);
        user.status.unblockTimer = Date.parse(new Date(new Date().getTime() + 1000 * 60 * 60 * 24));
        user.save();
    } catch (err) {
        return next(new HttpError(
            err,
            500
        ))
    }

    res.status(201)
}


const getHint = async (req, res, next) => {

    const requestId = req.params.pid;

    let request;
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

    res.json({ request: request.hint })
}


const userPasswordResetting = async (req, res, next) => {

    const { userId, answer, oldPassword, newPassword } = req.body;

    let user;
    try {
        user = await User.findById(userId)
        if (user === null) {
            throw new HttpError();
        }
    } catch (err) {
        return next(new HttpError(
            'Sorry something went wrong, please try again later.'
            , 401)
        )
    }


    if (user.status.isLoggedIn) {
        throw new HttpError(
            'You are logged in another device, please log out to continue.',
            403)
    }

    let isValidPassword = false;

    try {
        isValidPassword = await bcrypt.compare(oldPassword, user.password)

    } catch (err) {
        return next(new HttpError(
            'Could not log you in, please check your credentials and try again',
            500
        ))
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(newPassword, 12)
    } catch (err) {

        return next(new HttpError(
            'Sorry something went wrong, please try again later.'
            , 500
        ))
    }

    let isPasswordSame = true;

    try {
        isPasswordSame = await bcrypt.compare(newPassword, user.password)
    } catch (err) {
        return next(new HttpError(
            'Sorry something went wrong, please try again later.5435'
            , 500
        ))
    }


    try {
        if (isValidPassword && !isPasswordSame && user.answer === answer) {
            user.password = hashedPassword
            user.save();
        } else {
            throw new HttpError();
        }
    } catch (err) {
        return next(new HttpError(
            'The new password cannot match the old one.'
            , 500
        ))
    }


    res.status(201).json({ message: 'Your password has been succesfully changed.' });
}



const passwordRecovery = async (req, res, next) => {

    const { email } = req.body;



    let user;
    try {
        user = await User.findOne({ email: email })
        if (user === null) {
            throw new HttpError();
        }
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
        if (user.status.isLoggedIn) {
            throw new HttpError()
        }
    } catch (err) {
        return next(new HttpError(
            'You are logged in another device, please log out to continue.',
            403))
    }





    try {
        if (user.status.passwordRequest > 2) {
            user.status.isBlocked = true;
            user.status.dateUntilBlocked = getUnblockDate();
            user.status.unblockTimer = getUnblockTimer();
            user.status.passwordRequest = 0;
            user.save();
            throw new HttpError()
        }
    } catch (err) {
        return next(new HttpError(
            'Sorry but you have exceeded the daily limit of password recovery request',
            504
        )
        )
    }

    try {
        if (user.status.unblockTimer > new Date().getTime()) {
            throw new HttpError()
        }
    } catch (err) {
        return next(new HttpError(
            'Sorry but this account has been blocked for security reasons'
            +
            ` until ${user.status.dateUntilBlocked}`,
            504
        )
        )
    }

    let existingRequest;
    try {
        existingRequest = await Recovery.find({ creator: user._id })
    } catch (err) {
        console.log(err)
    }
    if (existingRequest.length > 0) {

        try {
            await Recovery.deleteMany({ creator: user._id })
        } catch (err) {
            console.log(err)
        }
    }

    try {

        const requestId = uuidv4()
        const newRequest = new Recovery({
            requestId: requestId,
            numberOfAttempts: 0,
            hint: user.hint,
            requestDate: new Date(),
            creator: user._id
        })
        newRequest.save();
        recoveryMessage(email, requestId, user.fullName.firstName)
        user.status.passwordRequest += 1;
        user.save();

    } catch (err) {
        return next(new HttpError(
            'Something went wrong, please try again later.',
            500)
        )
    }

    res.status(201).json({ message: 'Please check your email inbox.' });
}

const PasswordReset = async (req, res, next) => {

    const { answer, password } = req.body;

    const requestId = req.params.pid;

    let request;
    try {
        request = await Recovery.findOne({ requestId: requestId })
    } catch (err) {
        return next(new HttpError(
            'Could not update your password, please try again.',
            400
        ))
    }

    let user;
    try {
        user = await User.findById(request.creator)
    } catch (err) {
        return next(new HttpError('whaat?', 500))
    }

    try {
        if (user.status.isLoggedIn) {
            throw new HttpError()
        }
    } catch (err) {
        return next(new HttpError(
            'You are logged in another device, please log out to continue.',
            403))
    }


    let isPasswordSame = false;

    try {
        isPasswordSame = await bcrypt.compare(password, user.password)

    } catch (err) {
        return next(new HttpError(
            'Could not log you in, please check your credentials and try again',
            500
        ))
    }



    if (request.numberOfAttempts > 4) {

        user.status.isBlocked = true;
        user.status.dateUntilBlocked = getUnblockDate();
        user.status.unblockTimer = getUnblockTimer();
        user.save();
        return next(new HttpError(
            'Security measures failed multiple times'
            +
            ' in a row. this account has been blocked for 24 hours.',
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
        if (!isPasswordSame) {
            if (user.answer === answer) {
                user.password = hashedPassword;
                user.status.loginAttempts = 0;
                await user.save();
            } else {
                request.numberOfAttempts += 1;
                request.save();
                throw new HttpError(
                    'The answer you gave does not match the one in our database'
                    );
            }
        } else {
            request.numberOfAttempts += 1;
            request.save();
            throw new HttpError(
                'The new password cannot match the old one.'
                );
        }
    } catch (err) {
        return next(new HttpError(
            err,
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

exports.notMe = notMe;
exports.getHint = getHint;
exports.passwordRecovery = passwordRecovery;
exports.PasswordReset = PasswordReset;
exports.userPasswordResetting = userPasswordResetting; */