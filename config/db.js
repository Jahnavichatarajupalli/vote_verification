const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voter-verification', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        console.error('Connection string:', process.env.MONGODB_URI || 'mongodb://localhost:27017/voter-verification');
        process.exit(1);
    }
};

module.exports = connectDB;
