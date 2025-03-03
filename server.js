const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Voter = require('./models/Voter');

const Officer = require('./models/Officer');
require('dotenv').config({ path: path.join(__dirname, '.', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('Successfully connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

mongoose.connection.on('error', err => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

const app = express();
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization',"x-auth-token"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname,'uploads')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/voters', require('./routes/voters'));
// app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed!'), false);
}});




app.post('/api/admin/addOfficer', async (req, res) => {
    try {
        const { name, phoneNumber, job, pollingStation, age, gender } = req.body;
        if (!name || !phoneNumber || !job || !pollingStation || !age || !gender) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (await Officer.findOne({ phoneNumber })) {
            return res.status(400).json({ message: 'Officer with this phone number already exists' });
        }
        const officer = new Officer({ name, phoneNumber, job, pollingStation, age, gender });
        await officer.save();
        res.status(201).json({ message: 'Officer added successfully', officer });
    } catch (error) {
        res.status(500).json({ message: 'Error adding officer', error: error.message });
    }
});

app.post('/api/admin/addVoter', upload.single('photo'), async (req, res) => {
    try {
        const { name, epicNo, age, gender, address, pollingStation } = req.body;
        if (!name || !epicNo || !age || !gender || !address || !pollingStation) {
            return res.status(400).json({ message: 'All fields except photo are required' });
        }
        if (await Voter.findOne({ epicNo })) {
            return res.status(400).json({ message: 'Voter already exists' });
        }
        const voter = new Voter({
            name, epicNo, age, gender, address, pollingStation,
            photo: req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null
        });
        await voter.save();
        res.status(201).json({ message: 'Voter added successfully', voter });
    } catch (error) {
        res.status(500).json({ message: 'Error adding voter', error: error.message });
    }
});

app.get('/api/officers/profile', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const officer = await Officer.findById(decoded.id);
        if (!officer) return res.status(404).json({ message: 'Officer not found' });
        res.json(officer);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

(async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`Admin server running on port ${PORT}`));
})();