require('dotenv').config();

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const sermonRoutes = require('./routes/sermons');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');

const app = express();

mongoose.connect('mongodb+srv://' + process.env.MONGO_ATLAS_USER + ':' 
    + process.env.MONGO_ATLAS_PW + '@wc-lejqw.mongodb.net/' 
    + process.env.MONGO_ATLAS_DB + '?retryWrites=true&w=majority', 
    { useCreateIndex: true, useUnifiedTopology: true, useNewUrlParser: true })
    .catch((error) => {
        console.log('Failed to connect to the database.');
    });
mongoose.connection.on('error', (error) => {
    console.log('Failed to connect to the database.');
});

// body-parser parses the request body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/mp3", express.static(path.join("mp3")));

// Added headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');

    next();
});

app.use('/api/sermons', sermonRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

app.use(function (err, req, res, next) {
    if (res.headersSent) {
      return next(err);
    }

    res.status(500).json({
        error: 'Error: An error has occurred.'
    });
});

module.exports = app;