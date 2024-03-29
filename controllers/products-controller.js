const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');

const productCodeCreator = require('../util/product-code-creator');

const Product = require('../models/product');
const Admin = require('../models/admin');




const getAllProducts = async (req, res, next) => {
    let products;
    try {
        products = await Product.find({});
    } catch (err) {
        return next(new HttpError(
            'Could not fetch products, please try again.',
            500
        ))
    }

    res.json({ products: products.map(u => u.toObject({ getters: true })) });


}

const getProductByCode = async (req, res, next) => {
    const productId = req.params.pid;
    let products;
    try {
        products = await Product.find({ code: productId })
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, could not find product',
            500
        ))
    }

    res.json({ products: products.map(u => u.toObject({ getters: true })) })

}

const getProductByName = async (req, res, next) => {
    const name = req.params.pid;
    let products;
    try {
        products = await Product.find({ name: { $regex: name, $options: 'i' } })

    } catch (err) {
        return next(new HttpError(
            'Something went wrong on our side. Please try again later',
            500
        ))
    }

    try {
        if (products.length < 1) {
            throw new HttpError();
        }
    } catch (err) {
        return next(new HttpError(
            'Sorry but this product is not in our database',
            404
        ))
    }

    res.json({ products: products.map(u => u.toObject({ getters: true })) })
}





const createProduct = async (req, res, next) => {
    const { name, unit, price } = req.body;
    const adminId = req.params.pid;

    let admin;
    try {
        admin = await Admin.findById(adminId);
    } catch (err) {
        return next(new HttpError(
            'Authentication failed!',
            503
        ))
    }

    let code;
    try {
        code = productCodeCreator();
    } catch (err) {
        return next(err)
    }

    const sameCode = await Product.find({ code: code })
    if (sameCode) {
        code = productCodeCreator();
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(new HttpError(
            'Invalid inputs passed, please check your data',
            422
        ))
    }


    const createdProduct = new Product({
        name,
        unit,
        price,
        code: productCodeCreator(),
        image: req.file.path
    })

    try {
        createdProduct.save()
    } catch (err) {
        return next(new HttpError(
            'Creating product failed, please try again.',
            500
        ))
    }
    res.status(201).json({ message: 'Product has been added.' })

}





const updateProduct = async (req, res, next) => {
    const errors = validationResult(req)
    console.log(errors)
    if (!errors.isEmpty()) {
        return next(new HttpError(
            'Invalid inputs passed, please check your data',
            422
        ))
    }
    const { name, unit, price, code } = req.body;

    const adminId = req.params.pid;

    let admin;
    try {
        admin = await Admin.findById(adminId);
    } catch (err) {
        return next(new HttpError('Authentication failed!', 503))
    }



    const file = req.file || false;
    try {
        await Product.replaceOne({ code: code }, {
            name: name || this.name,
            unit: unit || this.unit,
            price: price || this.price,
            code: code || this.code,
            image: !file ? this.image : req.file.path
        })
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, could not update product',
            500
        ))
    }



    let product;
    try {

        product = await Product.findOne({ code: code })
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, could not update product',
            500
        ))
    }


    res.status(200).json({ message: `successfully updated.` })
}





const deleteProduct = async (req, res, next) => {
    const { code } = req.body;
    const adminId = req.params.pid;

    let admin;
    try {
        admin = await Admin.findById(adminId);
    } catch (err) {
        return next(new HttpError('Authentication failed!', 503))
    }

    try {
        await Product.deleteOne({ code: code });
    } catch (err) {
        return next(new HttpError(
            'Could not delete product, please try again.',
            500
        ))
    }

    res.json({ message: 'Product has been deleted.' })
}

exports.getAllProducts = getAllProducts;
exports.getProductByCode = getProductByCode;
exports.getProductByName = getProductByName;
exports.updateProduct = updateProduct;
exports.createProduct = createProduct;
exports.deleteProduct = deleteProduct; 