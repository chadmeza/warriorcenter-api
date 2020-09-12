const express = require('express');
const checkAuthentication = require('../middleware/checkAuthentication');

const usersController = require('../controllers/users');

const router = express.Router();

router.post('/signup', usersController.createUser);

router.post('/login', usersController.loginUser);

router.post('/forgot-password', usersController.forgotPassword);

router.put('/change-password', checkAuthentication, usersController.changePassword);

module.exports = router;