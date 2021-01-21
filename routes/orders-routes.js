const express = require('express');
const { check } = require('express-validator');

const ordersController = require('../controllers/orders-controller');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/:pid',
    [
        check('objectId').not().isEmpty()
    ],
    ordersController.getOrders
);

router.use(checkAuth);//jwt token middleware

router.post('/',
    [
        check('products').not().isEmpty(),
        check('dateOrdered').not().isEmpty(),
        check('dateToBeDelivered').not().isEmpty(),
        check('totalPrice').not().isEmpty(),
        check('numberOfItems').not().isEmpty(),
        check('creator').not().isEmpty()
    ],
    ordersController.createOrder
);


module.exports = router;