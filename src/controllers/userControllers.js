const expressAsyncHandler = require('express-async-handler');
const Course = require('../models/CourseSchemas/courseModel');
const Module = require('../models/CourseSchemas/CourseModule');
const Video = require('../models/CourseSchemas/VideoModel');
const Test = require('../models/CourseSchemas/testModel');
const User = require('../models/users');
const  mongoose =  require('mongoose');

const getCoursesbyUserId = expressAsyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required.',
        });
    }

    try {
        const user = await User.findById(userId).populate('courses');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        return res.status(200).json({
            success: true,
            courses: user.courses || [],
        });

    } catch (error) {
        console.error('Error in finding Courses for user:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching user courses.',
            error: error.message,
        });
    }
});


module.exports = {
    getCoursesbyUserId,
    // UserCourseEnrollment,
};
