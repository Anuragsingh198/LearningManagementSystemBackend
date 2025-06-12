const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { protect, isEmployee } = require('../middlewares/authmiddleware');
const { getCoursesbyUserId } = require('../controllers/userControllers');


const useRoutes = express.Router();


useRoutes.post('/register', registerUser);
useRoutes.post('/login', loginUser);

useRoutes.get('/profile', protect, (req, res) => {
    res.json({
        success: true,
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        },
    });
});

useRoutes.get('/logout', (req, res) => {
    res.json({ success: true, message: 'User logged out successfully' });
});
useRoutes.get('/:userId' , protect, getCoursesbyUserId)
useRoutes.get('/:userId' , protect, isEmployee , getCoursesbyUserId)

module.exports = useRoutes;
