require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voter-verification', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Old Voter Schema (with voterId)
const OldVoter = mongoose.model('Voter', new mongoose.Schema({
    voterId: String,
    name: String,
    age: Number,
    address: String,
    pollingStation: String
}));

async function migrateToEpic() {
    try {
        // Get all voters
        const voters = await OldVoter.find({});
        console.log(`Found ${voters.length} voters to migrate`);

        // Update schema
        await mongoose.connection.collection('voters').updateMany({}, [
            {
                $addFields: {
                    epicNo: "$voterId",
                    hasVoted: false
                }
            },
            {
                $unset: "voterId"
            }
        ]);

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateToEpic();
