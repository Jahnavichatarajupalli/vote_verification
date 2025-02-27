const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    pollingStation: {
        type: String,
        required: true
    },
    job: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other']
    }
});

module.exports = mongoose.model('Officer', officerSchema);
