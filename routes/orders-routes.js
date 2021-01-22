const express = require('express');
const { check } = require('express-validator');

const ordersController = require('../controllers/orders-controller');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/:pid',
    [
        check('objectId').not().isEmpty().escape().trim()
    ],
    ordersController.getOrders
);

router.use(checkAuth);//jwt token middleware

router.post('/',
    [
        check('products').not().isEmpty().escape().trim(),
        check('dateOrdered').not().isEmpty().escape().trim(),
        check('dateToBeDelivered').not().isEmpty().escape().trim(),
        check('totalPrice').not().isEmpty().escape().trim(),
        check('numberOfItems').not().isEmpty().escape().trim(),
        check('creator').not().isEmpty().escape().trim()
    ],
    ordersController.createOrder
);


module.exports = router;