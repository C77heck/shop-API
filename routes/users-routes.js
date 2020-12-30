const express = require('express');
const { check } = require('express-validator')
const checkAuth = require('../middleware/check-auth');

const usersController = require('../controllers/users-controller')

const router = express.Router();

router.post('/update/passwordrecovery',
    [check('email').normalizeEmail().isEmail()]
    , usersController.passwordRecovery
)

router.post('/signup',
    [
        check('fullName').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('password').isLength({ min: 6 }),
        check('phone').not().isEmpty(),
        check('address').not().isEmpty(),
        check('hint').not().isEmpty(),
        check('answer').isLength({ min: 4 })
    ],
    usersController.signup
)
router.post('/signin', usersController.signin)
router.get('/userinfo/:pid', usersController.getUserInfo)

router.use(checkAuth);

router.patch('/update/:pid', [
    check('fullName').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('phone').not().isEmpty(),
    check('address').not().isEmpty()
],
    usersController.updateUserData);



router.patch('/update/deliveryinstructions',
    usersController.addDeliveryInstructions
)



/* add in patch method for changing user data 
and delete as well.
*/



module.exports = router;