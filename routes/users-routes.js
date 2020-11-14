const express = require('express');
const { check } = require('express-validator')

const usersController = require('../controllers/users-controller')

const router = express.Router();

router.get('/', usersController.getUsers)

router.post('/signup',
    [
        check('fName').not().isEmpty(),
        check('lName').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 6 }),
        check('address').not().isEmpty()
    ],
    usersController.signup
)

router.post('/signin', usersController.signin)
/* add in patch method for changing user data 
and delete as well.
*/



module.exports = router;