const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    epicNo: { type: String, required: true, unique: true },
    age: { type: Number, required: true, min: 18, max: 120 },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    address: { type: String, required: true, trim: true },
    pollingStation: { type: String, required: true, trim: true },
    photo: { type: String},
    voted: { type: Boolean, default: false }
}, { timestamps: true }); // Adds createdAt & updatedAt fields

const Voter = mongoose.model('Voter', voterSchema);

module.exports = Voter;
