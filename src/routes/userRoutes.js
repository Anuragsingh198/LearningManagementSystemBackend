const express = require('express');
const { registerUser, loginUser, getEnrolledEmployees, resetPassword, generateOtpHandler, verifyOtpHandler } = require('../controllers/authController');
const { protect, isEmployee, isInstructor } = require('../middlewares/authmiddleware');
const {  enrollCourse, moduleProgress, videoProgress, testProgress, getCoursesByUserId, getCourseWithProgress} = require('../controllers/userControllers');
const { testSubmit, updateVideoProgress, createUserProgressForNewModule, checkVideoOrTestInUserProgressSchema, getCourseByCourseId } = require('../controllers/CourseController');

const useRoutes = express.Router();

useRoutes.post('/register', registerUser);
useRoutes.post('/login', loginUser);
useRoutes.post('/test-submit' ,protect,isEmployee , testSubmit)
useRoutes.post('/enroll-course' , protect , isEmployee ,enrollCourse)
useRoutes.post('/course-progress' ,protect,  getCourseWithProgress);
useRoutes.post('/module-progress' , protect, isEmployee , moduleProgress);
useRoutes.post('/video-progress' , protect, isEmployee , videoProgress);
useRoutes.post('/test-progress' , protect, isEmployee , testProgress);

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
useRoutes.get('/:userId' , protect, getCoursesByUserId)
useRoutes.post('/video-progress', protect, updateVideoProgress)
useRoutes.get('/:courseId/enrolled-employees' ,protect , isInstructor, getEnrolledEmployees)

useRoutes.post('/reset-password' ,resetPassword)


useRoutes.post('/check-progress', protect, createUserProgressForNewModule)

useRoutes.post('/check-video-progress', protect, checkVideoOrTestInUserProgressSchema)

useRoutes.post('/generate-otp', generateOtpHandler)

useRoutes.post('/verify-otp', verifyOtpHandler)



// useRoutes.post('/enrollCourse' , protect, isEmployee , UserCourseEnrollment)
// useRoutes.post('/send-email' , sendEmailcontroller);

module.exports = useRoutes;
