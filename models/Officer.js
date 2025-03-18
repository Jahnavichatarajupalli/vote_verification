const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true,
        lowercase: true
    },
    job: { type: String, required: true, trim: true },
    pollingStation: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 18, max: 100 },
    gender: { type: String, required: true }
}, { timestamps: true });

// Remove email validation since it will be encrypted
officerSchema.path('email').validate(function(value) {
    return true; // Always return true since we're handling validation before encryption
});

const Officer = mongoose.model('Officer', officerSchema);

module.exports = Officer;
