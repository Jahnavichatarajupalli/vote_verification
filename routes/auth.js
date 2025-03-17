const express = require('express');
const router = express.Router();
const Officer = require('../models/Officer');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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

// Request OTP
router.post('/request-otp', async (req, res) => {
    try {
        const { email } = req.body;

        // Find officer by email
        const officer = await Officer.findOne({ email: email.toLowerCase() });
        if (!officer) {
            return res.status(401).json({ message: 'Invalid email address' });
        }

        // Delete old OTP (if exists) before creating a new one
        await OTP.deleteMany({ email: email.toLowerCase() });

        // Generate and save OTP with expiration
        const otp = generateOTP();
        await OTP.create({ email: email.toLowerCase(), otp, createdAt: new Date() });

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
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find and validate OTP
        const otpRecord = await OTP.findOne({ email: email.toLowerCase(), otp: otp });

        if (!otpRecord) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        // Check OTP expiration manually (extra security)
        const timeElapsed = (Date.now() - otpRecord.createdAt.getTime()) / 1000;
        if (timeElapsed > 60) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(401).json({ message: 'OTP expired. Please request a new one.' });
        }

        // Find officer
        const officer = await Officer.findOne({ email: email.toLowerCase() });
        if (!officer) {
            return res.status(401).json({ message: 'Officer not found' });
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: officer._id,
                email: officer.email,
                pollingStation: officer.pollingStation 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            officer: {
                id: officer._id,
                email: officer.email,
                name: officer.name,
                pollingStation: officer.pollingStation,
                job: officer.job
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get officer info
router.get('/officer', verifyToken, async (req, res) => {
    try {
        const officer = await Officer.findById(req.officer.id);
        res.json(officer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
