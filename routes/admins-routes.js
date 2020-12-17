const express = require('express');
const { check } = require('express-validator');

const adminsController = require('../controllers/admins-controller');

const router = express.Router();

router.get('/orders', adminsController.getOrders)

router.post('/adminsignup',
    [
        check('fullName').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 6 }),
        check('phone').not().isEmpty(),
        check('isAdmin').not().isEmpty()
    ],
    adminsController.adminSignup
)

router.post('/adminsignin', adminsController.adminSignin)
/* add in patch method for changing user data 
and delete as well.
*/



module.exports = router;