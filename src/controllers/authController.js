const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/users');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, userType:role } = req.body;
     console.log('Registering user:', { name, email, role });
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({
        name,
        email,
        password,
        role 
    });
    if (user) {
        res.status(201).json( {success: true, user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            courses:user.courses,
            token: generateToken(user._id),
        }});
        console.log('User registered successfully:', user);
    } else {
        res.status(400).json({ success: false, message: 'Invalid user data' });
    }
}
);

const  loginUser=  asyncHandler(async(req, res)=>{
    const {email , password} =   req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.json( {success: true, user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            courses:user.courses,
            token: generateToken(user._id),
        }});
    } else {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});


module.exports = {
  registerUser,
  loginUser,
};