require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voter-verification', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Voter Schema
const voterSchema = new mongoose.Schema({
    epicNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    address: { type: String, required: true },
    pollingStation: { type: String, required: true },
    hasVoted: { type: Boolean, default: false }
});

const Voter = mongoose.model('Voter', voterSchema);

// Test voter data
const testVoter = {
    epicNo: 'ABC123456',
    name: 'John Doe',
    age: 35,
    address: '123 Main St, City',
    pollingStation: 'PS001',
    hasVoted: false
};

// Add test voter
async function addTestVoter() {
    try {
        await Voter.findOneAndUpdate(
            { epicNo: testVoter.epicNo },
            testVoter,
            { upsert: true, new: true }
        );
        console.log('Test voter added successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error adding test voter:', error);
        process.exit(1);
    }
}

addTestVoter();
