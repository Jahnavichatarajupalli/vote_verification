const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

// Encryption configuration
const ENCRYPTION_KEY = crypto.scryptSync(process.env.JWT_SECRET || 'fallback-secret-key', 'salt', 32);
const ALGORITHM = 'aes-256-cbc';

// Function to generate deterministic IV from text
const generateIV = (text) => {
    const hash = crypto.createHash('sha256');
    hash.update(text);
    return Buffer.from(hash.digest('hex').slice(0, 32), 'hex');
};

// Encryption utility functions
const encrypt = (text) => {
    if (!text) return text;
    
    // Generate deterministic IV from the input text
    const iv = generateIV(text);
    
    // Create cipher with deterministic IV
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Store the IV with the encrypted text
    return `${iv.toString('hex')}:${encrypted}`;
};

const decrypt = (text) => {
    if (!text) return text;
    
    try {
        const [ivHex, encryptedText] = text.split(':');
        if (!ivHex || !encryptedText) return text;
        
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return text;
    }
};

// MongoDB connection function
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

module.exports = {
    connectDB,
    encrypt,
    decrypt
};
