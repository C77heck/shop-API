const express = require('express');
const { check } = require('express-validator')
const checkAuth = require('../middleware/check-auth');

const usersController = require('../controllers/users-controller')

const router = express.Router();

router.post('/signup',
    [
        check('fullName').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 6 }),
        check('phone').not().isEmpty(),
        check('address').not().isEmpty(),
    ],
    usersController.signup
)
router.post('/signin', usersController.signin)

router.use(checkAuth)

router.patch('/update', usersController.addDeliveryInstructions)
/* add in patch method for changing user data 
and delete as well.
*/



module.exports = router;