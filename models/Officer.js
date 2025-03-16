const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
    },
    job: { type: String, required: true, trim: true },
    pollingStation: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 18, max: 100 },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] }
}, { timestamps: true });

const Officer = mongoose.model('Officer', officerSchema);

module.exports = Officer;
