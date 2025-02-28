const express = require('express');
const router = express.Router();
const Officer = require('../models/Officer');
const jwt = require('jsonwebtoken');

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

// Officer Login
router.post('/login', async (req, res) => {
    try {
        const { username, phoneNumber } = req.body;

        // Find officer by phone number
        const officer = await Officer.findOne({ phoneNumber });

        if (!officer) {
            return res.status(401).json({ message: 'Invalid phone number' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: officer._id,
                username: officer.username,
                pollingStation: officer.pollingStation 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            officer: {
                id: officer._id,
                username: officer.username,
                name: officer.name,
                pollingStation: officer.pollingStation,
                job: officer.job
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get officer info
router.get('/officer', verifyToken, async (req, res) => {
    console.log("hii")
    try {
        const officer = await Officer.findById(req.officer.id)
        res.json(officer);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Export router only
module.exports = router;
