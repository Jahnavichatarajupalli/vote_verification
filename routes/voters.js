const express = require('express');
const app = express();
const router = express.Router();
const { verifyToken } = require('../middleware/auth');  // Keep existing import
const Voter = require('../models/Voter');
const { encrypt, decrypt } = require('../config/db');
const cors = require('cors');
app.use(cors());

// Function to decrypt voter data
const decryptVoterData = (voter) => {
    if (!voter) return null;
    try {
        return {
            _id: voter._id,
            name: decrypt(voter.name),
            epicNo: decrypt(voter.epicNo),
            age: voter.age,
            gender: decrypt(voter.gender),
            address: decrypt(voter.address),
            pollingStation: decrypt(voter.pollingStation),
            photo: voter.photo,
            voted: voter.voted,
            createdAt: voter.createdAt,
            updatedAt: voter.updatedAt
        };
    } catch (error) {
        console.error('Error decrypting voter:', error);
        return null;
    }
};

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
            voted: true 
        });
        
        // Get non-voted voters count
        const nonVotedCount = await Voter.countDocuments({ 
            pollingStation,
            voted: false 
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
        const pollingStation = encrypt(req.officer.pollingStation);
        
        let query = { pollingStation };
        
        if (status === 'voted') {
            query.voted = true;
        } else if (status === 'non-voted') {
            query.voted = false;
        }
        
        const voters = await Voter.find(query)
            .select('name epicNo age address pollingStation voted')
            .sort('name');

        // Decrypt voters data
        const decryptedVoters = voters.map(voter => decryptVoterData(voter)).filter(Boolean);
        res.json(decryptedVoters);
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
        
        console.log('Verifying voter with EPIC number:', epicNo);
        console.log('Officer polling station:', req.officer.pollingStation);
        
        if (!epicNo) {
            return res.status(400).json({ message: 'EPIC number is required' });
        }

        if (!req.officer.pollingStation) {
            return res.status(403).json({ message: 'Polling station not found in token' });
        }

        // Encrypt search parameters
        const encryptedEpicNo = encrypt(epicNo);
        const encryptedPollingStation = encrypt(req.officer.pollingStation);
        
        console.log('Encrypted EPIC number:', encryptedEpicNo);
        console.log('Encrypted polling station:', encryptedPollingStation);




        // First, try to find the voter by EPIC number only
        const voterByEpic = await Voter.findOne({ epicNo: encryptedEpicNo });
        console.log('Voter found by EPIC only:', voterByEpic ? 'Yes' : 'No');
        
        if (voterByEpic) {
            console.log('Voter polling station:', decrypt(voterByEpic.pollingStation));
            console.log('Expected polling station:', req.officer.pollingStation);
        }


        // Find voter with both EPIC and polling station
        const voter = await Voter.findOne({ 
            epicNo: encryptedEpicNo,
            pollingStation: encryptedPollingStation
        });

        if (!voter) {
            console.log('Voter not found with matching polling station');
            return res.status(404).json({ message: 'Voter not found in this polling station' });
        }

        if (voter.voted) {
            console.log('Voter has already voted');
            return res.status(400).json({ message: 'Voter has already cast their vote' });
        }

        // Decrypt voter data for response
        const decryptedVoter = decryptVoterData(voter);
        if (!decryptedVoter) {
            console.log('Error decrypting voter data');
            return res.status(500).json({ message: 'Error decrypting voter data' });
        }

        console.log('Voter verified successfully');
        res.json({ voter: decryptedVoter });
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
        const { epicNo } = req.body;
        
        if (!epicNo) {
            return res.status(400).json({ message: 'EPIC number is required' });
        }


        // Encrypt the EPIC number for comparison
        const encryptedEpicNo = encrypt(epicNo);
        
        const voter = await Voter.findOne({ epicNo: encryptedEpicNo });
        

        if (!voter) {
            return res.status(404).json({ message: 'Voter not found' });
        }

        voter.voted = true;  // Changed from hasVoted to voted to match schema
        await voter.save();


        // Decrypt voter data for response
        const decryptedVoter = decryptVoterData(voter);
        if (!decryptedVoter) {
            return res.status(500).json({ message: 'Error decrypting voter data' });
        }

        res.json({ message: 'Voter status updated successfully' });
    } catch (err) {
        console.error('Error marking voter as voted:', err);

        res.status(500).json({ message: 'Server error' });
    }
});

// Get all voters
router.get('/all', verifyToken, async (req, res) => {
    try {
        console.log('Fetching all voters for polling station:', req.officer.pollingStation);
        
        if (!req.officer.pollingStation) {
            return res.status(400).json({ message: 'Polling station not found in token' });
        }

        // Get all voters first
        const allVoters = await Voter.find({});
        console.log('Total voters in database:', allVoters.length);

        // Filter voters by matching decrypted polling station
        const matchingVoters = allVoters.filter(voter => {
            try {
                const decryptedStation = decrypt(voter.pollingStation);
                return decryptedStation === req.officer.pollingStation;
            } catch (err) {
                console.error('Error decrypting polling station:', err);
                return false;
            }
        });
        console.log('Matching voters found:', matchingVoters.length);

        // Decrypt each voter's data
        const decryptedVoters = matchingVoters.map(voter => {
            try {
                return {
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
            } catch (err) {
                console.error('Error decrypting voter data:', err);
                return null;
            }
        }).filter(Boolean);

        console.log('Successfully decrypted voters:', decryptedVoters.length);

        res.json({ 
            voters: decryptedVoters,
            total: decryptedVoters.length
        });
    } catch (error) {
        console.error('Error fetching all voters:', error);
        res.status(500).json({ message: 'Error fetching voters list' });
    }
});

// Get voted voters
router.get('/voted', verifyToken, async (req, res) => {
    try {
        console.log('Fetching voted voters for polling station:', req.officer.pollingStation);
        
        if (!req.officer.pollingStation) {
            return res.status(400).json({ message: 'Polling station not found in token' });
        }

        // Get all voted voters first
        const allVoters = await Voter.find({ voted: true });
        console.log('Total voted voters in database:', allVoters.length);

        // Filter voters by matching decrypted polling station
        const matchingVoters = allVoters.filter(voter => {
            try {
                const decryptedStation = decrypt(voter.pollingStation);
                return decryptedStation === req.officer.pollingStation;
            } catch (err) {
                console.error('Error decrypting polling station:', err);
                return false;
            }
        });
        console.log('Matching voted voters found:', matchingVoters.length);

        // Decrypt each voter's data
        const decryptedVoters = matchingVoters.map(voter => {
            try {
                return {
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
            } catch (err) {
                console.error('Error decrypting voter data:', err);
                return null;
            }
        }).filter(Boolean);

        console.log('Successfully decrypted voted voters:', decryptedVoters.length);

        res.json({ 
            voters: decryptedVoters,
            total: decryptedVoters.length
        });
    } catch (error) {
        console.error('Error fetching voted voters:', error);
        res.status(500).json({ message: 'Error fetching voters list' });
    }
});

// Get yet to vote voters
router.get('/yet-to-vote', verifyToken, async (req, res) => {
    try {
        console.log('Fetching yet to vote voters for polling station:', req.officer.pollingStation);
        
        if (!req.officer.pollingStation) {
            return res.status(400).json({ message: 'Polling station not found in token' });
        }

        // Get all non-voted voters first
        const allVoters = await Voter.find({ voted: false });
        console.log('Total non-voted voters in database:', allVoters.length);

        // Filter voters by matching decrypted polling station
        const matchingVoters = allVoters.filter(voter => {
            try {
                const decryptedStation = decrypt(voter.pollingStation);
                return decryptedStation === req.officer.pollingStation;
            } catch (err) {
                console.error('Error decrypting polling station:', err);
                return false;
            }
        });
        console.log('Matching non-voted voters found:', matchingVoters.length);

        // Decrypt each voter's data
        const decryptedVoters = matchingVoters.map(voter => {
            try {
                return {
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
            } catch (err) {
                console.error('Error decrypting voter data:', err);
                return null;
            }
        }).filter(Boolean);

        console.log('Successfully decrypted non-voted voters:', decryptedVoters.length);

        res.json({ 
            voters: decryptedVoters,
            total: decryptedVoters.length
        });
    } catch (error) {
        console.error('Error fetching yet to vote voters:', error);
        res.status(500).json({ message: 'Error fetching voters list' });
    }
});

module.exports = router;
