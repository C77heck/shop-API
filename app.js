const fs = require('fs');
const path = require('path');

require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');


const HttpError = require('./models/http-error')

const productsRoutes = require('./routes/products-routes');
const usersRoutes = require('./routes/users-routes');
const adminsRoutes = require('./routes/admins-routes');
const ordersRoutes = require('./routes/orders-routes');

const app = express();
app.use(bodyParser.json())


app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE')
    next()
})
mongoose.set('useCreateIndex', true);


app.use('/api/orders', ordersRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/admin', adminsRoutes)


app.use((req, res, next) => {
    const error = new HttpError('Could not find this route.', 404);
    throw error;
});


app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, err => {
            console.log(err);
        });
    }
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ch77ecked.eih2z.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
        { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(2000 || process.env.PORT, () => console.log('its running'));
    })
    .catch(err => {
        console.log(err)
    })

