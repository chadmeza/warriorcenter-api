const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isApproved: {
        type: Boolean,
        required: true
    }
});

userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign(
        { email: this.email, userId: this._id }, 
        process.env.JWT_TOKEN,
        { expiresIn: '3h' });

    return token;
};

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);