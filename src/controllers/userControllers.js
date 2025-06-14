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



const UserCourseEnrollment = expressAsyncHandler(async (req, res) => {
    const { courseId } = req.body;
    console.log("course id  from  course  enrollment  cotroller is : " , courseId)
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({success: false,message: 'Invalid course ID.'});
    }

    try {
        const course =   await Course.findById(courseId);
        const user = await User.findById(req.user._id).populate('courses');
        if (!course) {
            return res.status(404).json({success: false,message: 'Course not found.'});
        }

        if (!user) {
            return res.status(404).json({success: false,message: 'User not found.'});
        }
        const courseExists = user.courses.some(
            (course) => course._id.toString() === courseId
        );

        if (courseExists) {
            return res.status(409).json({success: false,message: 'Course already enrolled.',});
        }
        user.courses.push(courseId);
        course.students.push(user_id);
        await course.save()
        await user.save();

        return res.status(200).json({esuccess: true,emessage: 'Course enrolled successfully.'});

    } catch (error) {
        console.error('Error enrolling course:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Server error while enrolling course.',
            error: error.message,
        });
    }
});

module.exports = {
    getCoursesbyUserId,
    UserCourseEnrollment,
};
