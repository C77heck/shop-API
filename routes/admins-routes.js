const express = require('express');
const { check } = require('express-validator');

const adminsController = require('../controllers/admins-controller');

const router = express.Router();



router.get('/bycode/:pid', adminsController.getProduct)//product fetch for update



router.post('/adminsignin',
    [
        check('accountID').not().isEmpty().escape().trim(),
        check('password').not().isEmpty()

    ], adminsController.adminSignin);




module.exports = router;