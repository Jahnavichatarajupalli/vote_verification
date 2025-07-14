const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Voter = require('./models/Voter');
const Officer = require('./models/Officer');
const { encrypt, decrypt } = require('./config/db');
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

        // Drop old indexes and recreate new ones
        console.log('Checking and updating indexes...');
        try {
            await Officer.collection.dropIndex('phoneNumber_1');
            console.log('Successfully dropped old phoneNumber index');
        } catch (error) {
            console.log('No old phoneNumber index to drop or already dropped');
        }

        // Ensure indexes are created
        await mongoose.model('Officer').syncIndexes();
        console.log('Successfully synchronized indexes');

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/voters', require('./routes/voters'));

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

// Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Function to encrypt officer data
const encryptOfficerData = (data) => {
    return {
        name: encrypt(data.name),
        email: encrypt(data.email.toLowerCase()),
        job: encrypt(data.job),
        pollingStation: encrypt(data.pollingStation),
        age: data.age, // Numbers don't need encryption
        gender: encrypt(data.gender)
    };
};

// Function to decrypt officer data
const decryptOfficerData = (data) => {
    if (!data) return null;
    return {
        ...data.toObject(),
        name: decrypt(data.name),
        email: decrypt(data.email),
        job: decrypt(data.job),
        pollingStation: decrypt(data.pollingStation),
        gender: decrypt(data.gender)
    };
};

// Function to encrypt voter data
const encryptVoterData = (data) => {
    return {
        name: encrypt(data.name),
        epicNo: encrypt(data.epicNo),
        age: data.age, // Numbers don't need encryption
        gender: encrypt(data.gender),
        address: encrypt(data.address),
        pollingStation: encrypt(data.pollingStation),
        photo: data.photo, // Don't encrypt photo URL
        voted: data.voted // Boolean doesn't need encryption
    };
};

// Function to decrypt voter data
const decryptVoterData = (data) => {
    if (!data) return null;
    return {
        ...data.toObject(),
        name: decrypt(data.name),
        epicNo: decrypt(data.epicNo),
        gender: decrypt(data.gender),
        address: decrypt(data.address),
        pollingStation: decrypt(data.pollingStation)
    };
};

app.post('/api/admin/addOfficer', async (req, res) => {
    try {
        console.log('Received request to add officer');
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
        
        const { name, email, job, pollingStation, age, gender } = req.body;
        
        console.log('Extracted officer data:', { name, email, job, pollingStation, age, gender });
        
        if (!name || !email || !job || !pollingStation || !age || !gender) {
            console.log('Missing required fields:', { name, email, job, pollingStation, age, gender });
            return res.status(400).json({ 
                message: 'All fields are required',
                receivedFields: { name, email, job, pollingStation, age, gender }
            });
        }

        // Validate age
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
            console.log('Invalid age:', age);
            return res.status(400).json({ message: 'Age must be between 18 and 100' });
        }

        // Validate gender before encryption
        if (!['Male', 'Female', 'Other'].includes(gender)) {
            console.log('Invalid gender:', gender);
            return res.status(400).json({ 
                message: 'Invalid gender value. Must be one of: Male, Female, Other',
                receivedGender: gender
            });
        }

        // Check if officer with same email already exists
        console.log('Checking for existing officer with email:', email);
        const existingOfficer = await Officer.findOne({ email: encrypt(email.toLowerCase()) });
        if (existingOfficer) {
            console.log('Officer with email already exists:', email);
            return res.status(400).json({ message: 'Officer with this email already exists' });
        }

        // Encrypt the data
        console.log('Encrypting officer data...');
        const encryptedData = encryptOfficerData({ name, email, job, pollingStation, age: ageNum, gender });

        console.log('Creating officer with encrypted data:', {
            ...encryptedData,
            name: '[encrypted]',
            email: '[encrypted]',
            job: '[encrypted]',
            pollingStation: '[encrypted]',
            gender: '[encrypted]'
        });

        // Create and save officer with encrypted data
        console.log('Creating new officer document...');
        const officer = new Officer(encryptedData);
        console.log('Saving officer to database...');
        await officer.save();

        // Decrypt for response
        console.log('Decrypting officer data for response...');
        const decryptedOfficer = decryptOfficerData(officer);

        console.log('Officer saved successfully:', decryptedOfficer);

        res.status(201).json({ 
            message: 'Officer added successfully', 
            officer: decryptedOfficer 
        });
    } catch (error) {
        console.error('Error adding officer:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Error adding officer', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.post('/api/admin/addVoter', upload.single('photo'), async (req, res) => {
    try {
        console.log('Received voter data:', req.body);
        console.log('Received file:', req.file);
        
        const { name, epicNo, age, gender, address, pollingStation } = req.body;
        
        // Validate required fields
        if (!name || !epicNo || !age || !gender || !address || !pollingStation) {
            console.log('Missing required fields:', { name, epicNo, age, gender, address, pollingStation });
            return res.status(400).json({ 
                message: 'All fields except photo are required',
                receivedFields: { name, epicNo, age, gender, address, pollingStation }
            });
        }

        // Validate photo
        if (!req.file) {
            return res.status(400).json({ message: 'Photo is required' });
        }

        // Validate age
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
            return res.status(400).json({ message: 'Age must be between 18 and 120' });
        }

        // Validate gender before encryption
        if (!['Male', 'Female', 'Other'].includes(gender)) {
            return res.status(400).json({ 
                message: 'Invalid gender value. Must be one of: Male, Female, Other',
                receivedGender: gender
            });
        }

        // Check if voter with same EPIC number already exists
        const existingVoter = await Voter.findOne({ epicNo: encrypt(epicNo) });
        if (existingVoter) {
            console.log('Voter with EPIC number already exists:', epicNo);
            // Delete uploaded file if voter exists
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: 'Voter with this EPIC number already exists' });
        }

        // Create voter data object with encrypted fields
        const voterData = {
            name: encrypt(name),
            epicNo: encrypt(epicNo),
            age: ageNum,
            gender: encrypt(gender),
            address: encrypt(address),
            pollingStation: encrypt(pollingStation),
            photo: `http://localhost:5000/uploads/${req.file.filename}`,
            voted: false
        };

        console.log('Creating voter with encrypted data:', {
            ...voterData,
            name: '[encrypted]',
            epicNo: '[encrypted]',
            gender: '[encrypted]',
            address: '[encrypted]',
            pollingStation: '[encrypted]'
        });

        // Create and save voter
        const voter = new Voter(voterData);
        await voter.save();

        // Decrypt data for response
        const decryptedVoter = {
            _id: voter._id,
            name: decrypt(voter.name),
            epicNo: decrypt(voter.epicNo),
            age: voter.age,
            gender: decrypt(voter.gender),
            address: decrypt(voter.address),
            pollingStation: decrypt(voter.pollingStation),
            photo: voter.photo,
            voted: voter.voted
        };

        console.log('Voter saved successfully:', decryptedVoter);

        res.status(201).json({ 
            message: 'Voter added successfully', 
            voter: decryptedVoter 
        });
    } catch (error) {
        // Delete uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error adding voter:', error);
        res.status(500).json({ 
            message: 'Error adding voter', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.get('/api/officers/profile', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const officer = await Officer.findById(decoded.id);
        if (!officer) return res.status(404).json({ message: 'Officer not found' });

        // Decrypt the officer data before sending
        const decryptedOfficer = {
            name: decrypt(officer.name),
            email: decrypt(officer.email),
            job: decrypt(officer.job),
            pollingStation: decrypt(officer.pollingStation),
            age: officer.age, // age is not encrypted
            gender: decrypt(officer.gender)
        };
        
        res.json(decryptedOfficer);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

(async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`Admin server running on port ${PORT}`));
})();
