require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const User = require('../models/user');

exports.createUser = async (req, res, next) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);

        const user = {
            email: req.body.email,
            password: hash,
            isApproved: false
        };

        const newUser = await User.create(user);
       
        const emailSubject = 'New User Added - Warrior Center CMS';
        const emailText = user.email + ' was added.';
        const emailHtml = '<h1>New User Added</h1><hr><h2>Warrior Center CMS</h2><p>' + user.email + ' was added.</p>';

        const emailResponse = sendEmail(process.env.EMAIL_NEW_USER_TO, emailSubject, emailText, emailHtml);
        
        res.status(201).json({
            newUser: newUser,
            emailResponse: emailResponse
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not create user.'
        });
    }
};

exports.loginUser = async (req, res, next) => {
    let loggedInUser;

    try {
        // Try to find a user account with a matching email address
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
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
        const result = await bcrypt.compare(req.body.password, user.password);

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
    } catch(error) {
        res.status(500).json({
            error: 'Could not login to this account.'
        });
    }
};

exports.forgotPassword = async (req, res, next) => {
    let userAccount;
    let newPassword = '';

    try {
        // Try to find a user account with a matching email address
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                error: 'Could not find a matching user account.'
            });
        }

        userAccount = user;
        
        newPassword = generateNewPassword();

        const hash = await bcrypt.hash(newPassword, 10);

        const updatedUser = new User({
            _id: userAccount._id,
            email: userAccount.email,
            password: hash,
            isApproved: userAccount.isApproved
        });

        const result = await User.updateOne({ _id: userAccount._id }, updatedUser);

        if (result.n <= 0) {
            return res.status(401).json({ 
                error: 'User is not authorized to make this change.' 
            });
        }

        const emailSubject = 'Password Reset - Warrior Center CMS';
        const emailText = 'Your password has been reset. Please login with this new password - ' + newPassword + '. You can change your password once you are logged in.';
        const emailHtml = '<h1>Password Reset</h1><hr><h2>Warrior Center CMS</h2><p>Your password has been reset. Please login with this new password - ' + newPassword + '. You can change your password once you are logged in.</p>';

        const emailResponse = sendEmail(userAccount.email, emailSubject, emailText, emailHtml);
        
        res.status(200).json({ 
            user: result,
            emailResponse: emailResponse
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not update this user.'
        });
    }
};

exports.changePassword = async (req, res, next) => {
    let userAccount;
    let newPassword = req.body.password;

    try {
        // Try to find a user account with a matching ID
        const user = await User.findOne({ _id: req.userData.userId });

        if (!user) {
            return res.status(404).json({
                error: 'Could not find a matching user account.'
            });
        }

        userAccount = user;

        const hash = await bcrypt.hash(newPassword, 10);

        const updatedUser = new User({
            _id: userAccount._id,
            email: userAccount.email,
            password: hash,
            isApproved: userAccount.isApproved
        });

        const result = await User.updateOne({ _id: userAccount._id }, updatedUser);

        if (result.n <= 0) {
            return res.status(401).json({ 
                error: 'User is not authorized to make this change.' 
            });   
        }

        res.status(200).json({ 
            user: result
        });
    } catch(error) {
        res.status(500).json({
            error: 'Could not update this user.'
        });
    }
};

const sendEmail = (emailAddress, emailSubject, emailText, emailHtml) => {
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
        to: emailAddress,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
    };

    let emailResponse = '';
        
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            emailResponse = error;
        } else {
            emailResponse = info.response;
        }
    });

    return emailResponse;
};

const generateNewPassword = () => {
    let generatedPassword = '';

    // Create new password
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    const passwordLength = 10;

    for (let i = 0; i < passwordLength; i++) {
        let random = Math.floor(Math.random() * chars.length);
        generatedPassword += chars.substring(random, random + 1);
    }

    return generatedPassword;
}