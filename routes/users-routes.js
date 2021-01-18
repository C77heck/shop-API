const express = require('express');
const { check } = require('express-validator')
const checkAuth = require('../middleware/check-auth');

const usersController = require('../controllers/users-controller')

const router = express.Router();

router.get('/signout/:pid', usersController.signout)




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
router.post('/contact',
    [
        check('name').not().isEmpty(),
        check('email').normalizeEmail().isEmail(),
        check('message').not().isEmpty()
    ],
    usersController.contact)

router.post('/signin', usersController.signin)
router.get('/gethint/:pid', usersController.getUserHint)

router.use(checkAuth);

router.post('/favourites/:pid',
    [
        check('productId').not().isEmpty()
    ],
    usersController.favourtiesHandler)

router.get('/userinfo/:pid', usersController.getUserInfo)


router.patch('/updatedata/:pid', [
    check('fullName').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('phone').not().isEmpty(),
    check('address').not().isEmpty()
],
    usersController.updateUserData);


router.patch('/update/deliveryinstructions',
    usersController.addDeliveryInstructions
)







module.exports = router;