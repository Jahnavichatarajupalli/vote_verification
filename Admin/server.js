const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/voters';

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB at:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('Successfully connected to MongoDB');
        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        return false;
    }
};

const retryConnection = async (retries = 3, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        const connected = await connectDB();
        if (connected) return true;
        console.log(`Connection attempt ${i + 1} failed. Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
};

mongoose.connection.on('connected', () => console.log('Mongoose connected to MongoDB'));
mongoose.connection.on('error', err => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected from MongoDB'));

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:5001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Set up storage for uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Define Voter Schema
const voterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    epicNo: { type: String, required: true, unique: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    address: { type: String, required: true },
    pollingStation: { type: String, required: true },
    photo: { type: String },
    voted: { type: Boolean, default: false }
});
const Voter = mongoose.model('Voter', voterSchema);

// Define Officer Schema
const officerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    job: { type: String, required: true },
    pollingStation: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] }
});
const Officer = mongoose.model('Officer', officerSchema);

app.use(async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected. Attempting to reconnect...');
        const connected = await connectDB();
        if (!connected) {
            return res.status(500).json({ message: 'Database connection error. Please ensure MongoDB is running.' });
        }
    }
    next();
});

app.post('/api/admin/addVoter', upload.single('photo'), async (req, res) => {
    console.log('Processing voter addition request:', req.body);

    if (mongoose.connection.readyState !== 1) {
        console.error('Database is not connected');
        return res.status(500).json({ message: 'Database connection error' });
    }

    try {
        const { name, epicNo, age, gender, address, pollingStation } = req.body;

        if (!name || !epicNo || !age || !gender || !address || !pollingStation) {
            return res.status(400).json({ message: 'All fields except photo are required' });
        }

        console.log('Checking existing voters...');
        const existingVoter = await Voter.findOne({ epicNo }).exec();

        if (existingVoter) {
            console.log('Voter already exists:', existingVoter);
            return res.status(400).json({ message: 'Voter already exists' });
        }

        const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

        console.log('Saving new voter...');
        const voter = new Voter({ name, epicNo, age, gender, address, pollingStation, photo: photoPath });
        await voter.save();
        console.log('Voter saved successfully:', voter);

        res.status(201).json({ message: 'Voter added successfully', voter });
    } catch (error) {
        console.error('Error adding voter:', error);
        res.status(500).json({ message: 'Error adding voter', error: error.message });
    }
});

app.post('/api/voters/add', upload.single('photo'), async (req, res) => {
    try {
        const { name, epicNo, age, gender, address } = req.body;
        
        // Check if voter already exists
        const existingVoter = await Voter.findOne({ epicNo });
        if (existingVoter) {
            if (req.file) {
                // Delete uploaded file if voter already exists
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: 'Voter with this EPIC number already exists' });
        }

        const photoPath = req.file ? `uploads/${req.file.filename}` : undefined;
        
        const voter = new Voter({
            name,
            epicNo,
            age,
            gender,
            address,
            photo: photoPath
        });

        await voter.save();
        res.status(201).json({ message: 'Voter added successfully', voter });
    } catch (error) {
        if (req.file) {
            // Delete uploaded file if there's an error
            fs.unlinkSync(req.file.path);
        }
        console.error('Error adding voter:', error);
        res.status(500).json({ message: 'Error adding voter', error: error.message });
    }
});

app.get('/api/officers/profile', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const officer = await Officer.findById(decoded.id);
        
        if (!officer) {
            return res.status(404).json({ message: 'Officer not found' });
        }

        res.json(officer);
    } catch (error) {
        console.error('Error fetching officer profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

(async () => {
    const connected = await retryConnection();
    if (!connected) {
        console.error('Failed to connect to MongoDB after multiple retries. Please ensure MongoDB is running.');
        process.exit(1);
    }

    const PORT = process.env.ADMIN_PORT || 5001;
    app.listen(PORT, () => {
        console.log(`Admin server running on port ${PORT}`);
    });
})();