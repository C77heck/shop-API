const express = require('express');
const { check } = require('express-validator');

const adminsController = require('../controllers/admins-controller');

const router = express.Router();


router.get('/bycode/:pid', adminsController.getProduct)

router.get('/orders', adminsController.getOrders)



router.post('/adminsignin', adminsController.adminSignin)




module.exports = router;