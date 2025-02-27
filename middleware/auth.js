const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add officer data to request
        req.officer = decoded;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = { verifyToken };
