const express = require('express');
const router = express.Router();
const Officer = require('../models/Officer');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { encrypt, decrypt } = require('../config/db');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify email configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.officer = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to safely decrypt data
const safeDecrypt = (data) => {
    if (!data) return null;
    try {
        return decrypt(data);
    } catch (err) {
        console.error('Decryption error:', err);
        return null;
    }
};

// Function to decrypt officer data
const decryptOfficerData = (data) => {
    if (!data) return null;
    try {
        return {
            ...data.toObject(),
            name: safeDecrypt(data.name),
            email: safeDecrypt(data.email),
            job: safeDecrypt(data.job),
            pollingStation: safeDecrypt(data.pollingStation),
            gender: safeDecrypt(data.gender)
        };
    } catch (err) {
        console.error('Error decrypting officer data:', err);
        return null;
    }
};

// Request OTP
router.post('/request-otp', async (req, res) => {
    try {
        console.log('Received OTP request:', req.body);
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const lowercaseEmail = email.toLowerCase();
        console.log('Processing OTP request for email:', lowercaseEmail);

        // Find officer by email
        const officers = await Officer.find();
        console.log('Total officers found:', officers.length);

        const officer = officers.find(o => {
            const decryptedEmail = safeDecrypt(o.email);
            return decryptedEmail && decryptedEmail.toLowerCase() === lowercaseEmail;
        });
        
        if (!officer) {
            console.log('No officer found with email:', lowercaseEmail);
            return res.status(401).json({ message: 'Invalid email address' });
        }

        console.log('Officer found:', { id: officer._id });

        // Delete old OTP (if exists) before creating a new one
        await OTP.deleteMany({ email: lowercaseEmail });

        // Generate and save OTP with expiration
        const otp = generateOTP();
        await OTP.create({ email: lowercaseEmail, otp, createdAt: new Date() });

        // Send OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Login OTP for Voter Verification System',
            text: `Your OTP for login is: ${otp}. This OTP will expire in 1 minute.`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP sent successfully' });

    } catch (error) {
        console.error('OTP request error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        const lowercaseEmail = email.toLowerCase();

        // Find and validate OTP
        const otpRecord = await OTP.findOne({ email: lowercaseEmail, otp });

        if (!otpRecord) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        // Check OTP expiration
        const timeElapsed = (Date.now() - otpRecord.createdAt.getTime()) / 1000;
        if (timeElapsed > 60) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(401).json({ message: 'OTP expired. Please request a new one.' });
        }

        // Find officer by email
        const officers = await Officer.find();
        const officer = officers.find(o => {
            const decryptedEmail = safeDecrypt(o.email);
            return decryptedEmail && decryptedEmail.toLowerCase() === lowercaseEmail;
        });
        
        if (!officer) {
            return res.status(401).json({ message: 'Officer not found' });
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Decrypt officer data for token and response
        const decryptedOfficer = decryptOfficerData(officer);
        if (!decryptedOfficer) {
            return res.status(500).json({ message: 'Error decrypting officer data' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: officer._id,
                email: decryptedOfficer.email,
                pollingStation: decryptedOfficer.pollingStation 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            officer: {
                id: officer._id,
                email: decryptedOfficer.email,
                name: decryptedOfficer.name,
                pollingStation: decryptedOfficer.pollingStation,
                job: decryptedOfficer.job
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ 
            message: 'Server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get officer info
router.get('/officer', verifyToken, async (req, res) => {
    try {
        const officer = await Officer.findById(req.officer.id);
        if (!officer) {
            return res.status(404).json({ message: 'Officer not found' });
        }
        
        // Decrypt officer data for response
        const decryptedOfficer = decryptOfficerData(officer);
        res.json(decryptedOfficer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
