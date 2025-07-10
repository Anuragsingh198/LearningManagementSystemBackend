const jwt = require('jsonwebtoken');
const User = require('../models/users');


const protect = async (req, res, next) => {
    let  token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
}

const isInstructor = (req, res, next) => {
    if(req.user && req.user.role === 'instructor') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, teachers only' });
    }
}
const isEmployee = (req, res, next) => {
    console.log("user from isemployee middelware : " , req.user )
    if(req.user && req.user.role === 'employee') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied, students only' });
    }
}

module.exports = {
    protect,
    isInstructor,
    isEmployee
};