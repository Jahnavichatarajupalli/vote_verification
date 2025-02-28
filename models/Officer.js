const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, unique: true, trim: true, match: /^[0-9]{10}$/ }, // Ensures a 10-digit phone number
    job: { type: String, required: true, trim: true },
    pollingStation: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 18, max: 100 }, // Sets a reasonable age range
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] }
}, { timestamps: true }); // Adds createdAt & updatedAt fields

const Officer = mongoose.model('Officer', officerSchema);

module.exports = Officer;
