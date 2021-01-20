const express = require('express');
const { check } = require('express-validator')

const fileUpload = require('../middleware/file-upload')
const productsControllers = require('../controllers/products-controller');

const Product = require('../models/product')

const router = express.Router();


router.get('/', productsControllers.getAllProducts)
router.get('/numbers/:pid', productsControllers.getProductByCode)
router.get('/letters/:pid', productsControllers.getProductByName)


router.post('/:pid',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty(),
        check('unit').not().isEmpty(),
        check('price').not().isEmpty()
    ],
    productsControllers.createProduct)

router.patch('/:pid',
    fileUpload.single('image'),
    [
        check('name').not().isEmpty(),
        check('unit').not().isEmpty(),
        check('price').not().isEmpty()
    ],
    productsControllers.updateProduct)

router.delete('/:pid', [
    check('code').not().isEmpty()
], productsControllers.deleteProduct)


module.exports = router;

