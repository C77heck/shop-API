const fs = require('fs');
const path = require('path');

require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const compression = require('compression');

const HttpError = require('./models/http-error');

//ROUTES

const resourceRoutes = require('./routes/resource-routes');
const productsRoutes = require('./routes/products-routes');
const usersRoutes = require('./routes/users-routes');
const adminsRoutes = require('./routes/admins-routes');
const ordersRoutes = require('./routes/orders-routes');
const recoveryRoutes = require('./routes/recovery-routes');

//MIDDLEWARE
const app = express();
app.use(bodyParser.json())

app.use(compression({
    level: 6,
    threshold: 5 * 1000,
}))

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE')
    next()
})
mongoose.set('useCreateIndex', true);

// API ENDPOINTS
app.use('/api/resources', resourceRoutes)
app.use('/api/products', productsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/recovery', recoveryRoutes);

//HANDLING INCORRECT ENDPOINTS ENTRY ATTEMPTS
app.use(() => {
    throw new HttpError('Could not find this route.', 404);
});

// DELETING UPLOADED IMAGES FROM THE FILESYSTEM
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


//MONGOOSE INITATION AND SERVER LAUNCH ASYNCRONOUSLY 
mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ch77ecked.eih2z.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
        { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        app.listen(process.env.PORT || 2000, () => console.log('Server is running'));
    })
    .catch(err => {
        console.log(err)
    })

