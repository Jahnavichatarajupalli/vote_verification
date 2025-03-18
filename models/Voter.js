const mongoose = require('mongoose');

const voterSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    epicNo: { type: String, required: true, unique: true },
    age: { type: Number, required: true, min: 18, max: 120 },
    gender: { type: String, required: true },
    address: { type: String, required: true, trim: true },
    pollingStation: { type: String, required: true, trim: true },
    photo: { type: String },
    voted: { type: Boolean, default: false }
}, { timestamps: true }); // Adds createdAt & updatedAt fields

// Add validation middleware
voterSchema.pre('save', function(next) {
    // Validate age
    if (this.age < 18 || this.age > 120) {
        next(new Error('Age must be between 18 and 120'));
        return;
    }
    next();
});

const Voter = mongoose.model('Voter', voterSchema);

module.exports = Voter;
