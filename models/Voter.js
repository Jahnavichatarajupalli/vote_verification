const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    epicNo: {
        type: String,
        required: true,
        unique: true
    },
    age: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other']
    },
    photo: {
        type: String,  // This will store the photo URL/path
        required: true
    },
    pollingStation: {
        type: String,
        required: true
    },
    hasVoted: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Voter', voterSchema);
