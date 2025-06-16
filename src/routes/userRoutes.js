const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { protect, isEmployee } = require('../middlewares/authmiddleware');
const { getCoursesbyUserId} = require('../controllers/userControllers');
const { testSubmit, enrollCourse, getCourseProgress } = require('../controllers/CourseController');


const useRoutes = express.Router();


useRoutes.post('/register', registerUser);
useRoutes.post('/login', loginUser);
useRoutes.post('/test-submit' ,protect,isEmployee , testSubmit)
useRoutes.post('/enroll-course' , protect , isEmployee ,enrollCourse)
useRoutes.post('/course-progress' ,protect,  getCourseProgress);
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
// useRoutes.post('/enrollCourse' , protect, isEmployee , UserCourseEnrollment)

module.exports = useRoutes;
