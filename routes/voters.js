const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Voter = require('../models/Voter');

// @route   GET /api/voters/statistics
// @desc    Get voter statistics for polling station
// @access  Private
router.get('/statistics', verifyToken, async (req, res) => {
    try {
        const pollingStation = req.officer.pollingStation;
        
        // Get total voters count
        const totalVoters = await Voter.countDocuments({ pollingStation });
        
        // Get voted voters count
        const votedCount = await Voter.countDocuments({ 
            pollingStation,
            hasVoted: true 
        });
        
        // Get non-voted voters count
        const nonVotedCount = await Voter.countDocuments({ 
            pollingStation,
            hasVoted: false 
        });

        res.json({
            total: totalVoters,
            voted: votedCount,
            nonVoted: nonVotedCount,
            pollingStation
        });
    } catch (error) {
        console.error('Error fetching voter statistics:', error);
        res.status(500).json({ message: 'Error fetching voter statistics' });
    }
});

// @route   GET /api/voters/list/:status
// @desc    Get voters list by voting status
// @access  Private
router.get('/list/:status', verifyToken, async (req, res) => {
    try {
        const { status } = req.params;
        const pollingStation = req.officer.pollingStation;
        
        let query = { pollingStation };
        
        // Add hasVoted condition based on status
        if (status === 'voted') {
            query.hasVoted = true;
        } else if (status === 'non-voted') {
            query.hasVoted = false;
        }
        
        const voters = await Voter.find(query)
            .select('name epicNo age address pollingStation hasVoted')
            .sort('name');
        
        res.json(voters);
    } catch (error) {
        console.error('Error fetching voters list:', error);
        res.status(500).json({ message: 'Error fetching voters list' });
    }
});

// @route   POST /api/voters/verify
// @desc    Verify voter by EPIC number
// @access  Private
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const { epicNo } = req.body;

        // Find voter by EPIC number
        const voter = await Voter.findOne({ epicNo });

        if (!voter) {
            return res.status(404).json({ message: 'Voter not found' });
        }

        if (voter.hasVoted) {
            return res.status(400).json({ message: 'Voter has already cast their vote' });
        }

        // Return voter details for face recognition
        res.json({
            voter: {
                id: voter._id,
                name: voter.name,
                epicNo: voter.epicNo,
                photo: voter.photo
            }
        });

    } catch (error) {
        console.error('Voter verification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/voters/mark-voted
// @desc    Mark a voter as having voted
// @access  Private
router.post('/mark-voted', verifyToken, async (req, res) => {
    try {
        const { voterId } = req.body;

        const voter = await Voter.findById(voterId);
        if (!voter) {
            return res.status(404).json({ message: 'Voter not found' });
        }

        if (voter.hasVoted) {
            return res.status(400).json({ message: 'Voter has already cast their vote' });
        }

        voter.hasVoted = true;
        await voter.save();

        res.json({ message: 'Vote recorded successfully' });

    } catch (error) {
        console.error('Mark voted error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
