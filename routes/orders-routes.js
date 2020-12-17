const express = require('express');
const { check } = require('express-validator');

const ordersController = require('../controllers/orders-controller');

const router = express.Router();

router.post('/',
    [
        check('products').not().isEmpty(),
        check('dateOrdered').not().isEmpty(),
        check('dateToBeDelivered').not().isEmpty(),
        check('creator').not().isEmpty()
    ],
    ordersController.createOrder
)


module.exports = router;