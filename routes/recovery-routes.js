const express = require('express');

const { check } = require('express-validator');

const recoveryController = require('../controllers/recovery-controller');

const router = express.Router();


//link in user email as security measure
router.get('/blockaccount/:pid',
    recoveryController.notMe
);

//hint fetch for the security question display
router.get('/gethint/:pid', 
recoveryController.getHint
)

//send a password recovery link to the given email
router.post('/passwordrecovery',
    [check('email').normalizeEmail().isEmail()]
    , recoveryController.passwordRecovery
);

//resetting the password
router.patch('/updatepassword/:pid',
    [
        check('password').isLength({ min: 6 }),
        check('answer').isLength({ min: 4 })
    ],
    recoveryController.PasswordReset
);


router.post('/userresetpassword/',
    [
        check('userId').not().isEmpty(),
        check('answer').isLength({ min: 4 }),
        check('oldPassword').isLength({ min: 6 }),
        check('newPassword').isLength({ min: 6 })
    ],
    recoveryController.userPasswordResetting
);


module.exports = router;