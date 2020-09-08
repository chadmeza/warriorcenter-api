require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models/user');

exports.createUser = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then((hash) => {
            const user = new User({
                email: req.body.email,
                password: hash,
                isApproved: false
            });
        
            user.save()
                .then((newUser) => {
                    const transporter = nodemailer.createTransport({
                        host: process.env.EMAIL_HOST,
                        port: 465,
                        secure: true, 
                        auth: {
                            user: process.env.EMAIL_USER,
                            pass: process.env.EMAIL_PW
                        }
                    });
                        
                    const mailOptions = {
                        from: process.env.EMAIL_FROM,
                        to: 'chadmeza@gmail.com',
                        subject: 'New User Added - Warrior Center CMS',
                        text: newUser.email + ' was added.',
                        html: "<h1>New User Added</h1><hr><h2>Warrior Center CMS</h2><p>" + newUser.email + " was added.</p>"
                    };

                    let emailResponse = '';
                        
                    transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            emailResponse = error;
                        } else {
                            emailResponse = info.response;
                        }
                    });
                    
                    res.status(201).json({
                        newUser: newUser,
                        emailResponse: emailResponse
                    });
                })
                .catch((error) => {
                    res.status(500).json({
                        error: 'Could not create user.'
                    });
                });
        });
};

exports.loginUser = (req, res, next) => {
    let loggedInUser;

    // Try to find a user account with a matching email address
    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                return res.status(401).json({
                    error: 'Could not find a matching user account.'
                });
            }

            loggedInUser = user;

            if (!user.isApproved) {
                return res.status(401).json({
                    error: 'User account has not yet been approved.'
                });
            }
            
            // Check if the password is correct
            return bcrypt.compare(req.body.password, user.password);
        })
        .then((result) => {
            if (!result) {
                return res.status(401).json({
                    error: 'Could not login. Please enter a valid password.'
                });
            }
        
            const token = loggedInUser.generateAuthToken();
            
            res.status(200).json({
                token: token,
                expiresIn: 10800,
                userId: loggedInUser._id
            });
        })
        .catch(err => {
            return res.status(401).json({
                error: 'Could not find a valid user account.'
            });
        });
};

exports.forgotPassword = (req, res, next) => {
    let userAccount;
    let newPassword = '';

    // Try to find a user account with a matching email address
    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                return res.status(401).json({
                    error: 'Could not find a matching user account.'
                });
            }

            userAccount = user;
            
            // Create new password
            const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            const passwordLength = 10;

            for (let i = 0; i < passwordLength; i++) {
                let random = Math.floor(Math.random() * chars.length);
                newPassword += chars.substring(random, random + 1);
            }

            return bcrypt.hash(newPassword, 10);
        })
        .then((hash) => {
            const updatedUser = new User({
                _id: userAccount._id,
                email: userAccount.email,
                password: hash,
                isApproved: userAccount.isApproved
            });

            User.updateOne({ _id: userAccount._id }, updatedUser)
                .then((result) => {
                    if (result.n > 0) {
                        const transporter = nodemailer.createTransport({
                            host: process.env.EMAIL_HOST,
                            port: 465,
                            secure: true, 
                            auth: {
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PW
                            }
                        });
                            
                        const mailOptions = {
                            from: process.env.EMAIL_FROM,
                            to: userAccount.email,
                            subject: 'Password Reset - Warrior Center CMS',
                            text: 'Your password has been reset. Please login with this new password - ' + newPassword + '. You can change your password once you are logged in.',
                            html: "<h1>Password Reset</h1><hr><h2>Warrior Center CMS</h2><p>Your password has been reset. Please login with this new password - " + newPassword + ". You can change your password once you are logged in.</p>"
                        };
    
                        let emailResponse = '';
                            
                        transporter.sendMail(mailOptions, function(error, info) {
                            if (error) {
                                emailResponse = error;
                            } else {
                                emailResponse = info.response;
                            }
                        });

                        res.status(200).json({ 
                            user: result,
                            emailResponse: emailResponse
                        });
                    } else {
                        res.status(401).json({ 
                            error: 'User is not authorized to make this change.' 
                        });
                    }
                })
                .catch((error) => {
                    res.status(500).json({
                        error: 'Could not update this user.'
                    });
                });
        });
};

exports.changePassword = (req, res, next) => {
    let userAccount;
    let newPassword = req.body.password;

    // Try to find a user account with a matching ID
    User.findOne({ _id: req.userData.userId })
        .then((user) => {
            if (!user) {
                return res.status(401).json({
                    error: 'Could not find a matching user account.'
                });
            }

            userAccount = user;

            return bcrypt.hash(newPassword, 10);
        })
        .then((hash) => {
            const updatedUser = new User({
                _id: userAccount._id,
                email: userAccount.email,
                password: hash,
                isApproved: userAccount.isApproved
            });

            User.updateOne({ _id: userAccount._id }, updatedUser)
                .then((result) => {
                    if (result.n > 0) {
                        res.status(200).json({ 
                            user: result
                        });
                    } else {
                        res.status(401).json({ 
                            error: 'User is not authorized to make this change.' 
                        });
                    }
                })
                .catch((error) => {
                    res.status(500).json({
                        error: 'Could not update this user.'
                    });
                });
        });
};