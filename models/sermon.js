const mongoose = require('mongoose');

const sermonSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    scripture: {
        type: String,
        required: true
    },
    speaker: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    mp3: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Sermon", sermonSchema);