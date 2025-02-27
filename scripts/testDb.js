const mongoose = require('mongoose');

async function testConnection() {
    try {
        await mongoose.connect('mongodb://localhost:27017/voter-verification', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Successfully connected to MongoDB!');
        
        // Test creating a collection
        const testSchema = new mongoose.Schema({
            test: String,
            timestamp: { type: Date, default: Date.now }
        });
        
        const Test = mongoose.model('Test', testSchema);
        
        // Try to write to database
        const testDoc = new Test({ test: 'Database write test' });
        await testDoc.save();
        console.log('Successfully wrote to database!');
        
        // Try to read from database
        const result = await Test.findOne({ test: 'Database write test' });
        console.log('Successfully read from database:', result);
        
        // Clean up
        await Test.deleteOne({ _id: result._id });
        console.log('Successfully deleted test document');
        
        await mongoose.connection.close();
        console.log('Connection closed successfully');
    } catch (error) {
        console.error('Database test failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
    }
}

testConnection();
