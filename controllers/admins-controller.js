const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken')

const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const Admin = require('../models/admin');


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
const adminSignup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
        const error = new HttpError(
            'Invalid inputs passed, please check your data',
            422
        )
        return next(error)
    }

    const { fullName, email, password, phone, isAdmin } = req.body;

    let existingAdmin;
    try {
        existingAdmin = await Admin.findOne({ email: email })
    } catch (err) {
        return next(new HttpError(
            'This user does not exist in the database',
            500
        ))
    }
    if (existingAdmin) {
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
            'Could not create admin, please try again.',
            500
        ))
    }


    const createdAdmin = new Admin({
        fullName,
        email,
        password: hashedPassword,
        phone,
        isAdmin
    })

    try {

        createdAdmin.save();

    } catch (err) {
        const error = new HttpError(' Signing up failed, please try again', 500)
        return next(error)

    }

    let token;
    try {

        token = jwt.sign({ userId: createdAdmin.id, email: createdAdmin.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    } catch (err) {

        return next(new HttpError(' Signing up failed, please try again', 500))
    }

    res
        .status(201)
        .json({
            userId: createdUser.id,
            email: createdUser.email,
            token: token,
            isAdmin: createdAdmin.isAdmin
        })

}

const adminSignin = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError('Invalid inputs passed, please check your data', 422)
        return next(error)
    }

    const { email, password } = req.body;
    let existingAdmin;

    try {
        existingAdmin = await Admin.findOne({ email: email })
    } catch (err) {
        return next(new HttpError(`Login failed, please try again later.`, 500))
    }

    if (!existingAdmin) {
        return next(new HttpError('Invalid credentials, please try again.', 401))
    }

    let isValidPassword = false;

    try {
        isValidPassword = await bcrypt.compare(password, existingAdmin.password)
    } catch (err) {
        return next(new HttpError('Could not log you in, please check your credentials and try again', 500))
    }

    let token;
    try {
        token = jwt.sign({ userId: existingAdmin.id, email: existingAdmin.email },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    } catch (err) {

        return next(new HttpError(' Signing in failed, please try again', 500))
    }


    res
        .json({
            message: 'Succesful login',
            userId: existingAdmin.id,
            email: existingAdmin.email,
            token: token,
            isAdmin: existingAdmin.isAdmin
        })

}


exports.getUsers = getUsers;
exports.adminSignup = adminSignup;
exports.adminSignin = adminSignin;