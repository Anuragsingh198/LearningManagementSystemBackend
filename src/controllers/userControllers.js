const expressAsyncHandler = require('express-async-handler');
const Course = require('../models/CourseSchemas/courseModel');
const Module = require('../models/CourseSchemas/CourseModule');
const Video = require('../models/CourseSchemas/VideoModel');
const Test = require('../models/CourseSchemas/testModel');
const User = require('../models/users');
const  mongoose =  require('mongoose');
const Progress = require('../models/CourseSchemas/courseSatusModel');

const getCoursesbyUserId = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid user ID is required.',
    });
  }

  const  role  =  req.user.role;
  try {
    if(role === "instructor"){
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
    }
    
    else {
        const coursesWithProgress = await Progress.find({ user: userId }).populate('course');
        if (!coursesWithProgress || coursesWithProgress.length === 0) {
          return res.status(200).json({
            success: true,
            message: 'No registered courses found.',
            courses :[]
          });
        }
    
        const courses = coursesWithProgress
          .map((progress) => {
            const course = progress.course;
            if (!course) return null;
    
            return {
              _id: course._id,
              title: course.title,
              description: course.description,
              instructorName: course.instructorName,
              category: course.category,
              thumbnail: course.thumbnail,
              certificate: course.certificate,
              compulsory: course.compulsory,
              courseDuration: course.courseDuration,
    
              progressStatus: progress.status,
              overallPercentage: progress.overallPercentage,
              isCourseCompleted: progress.isCourseCompleted,
              remainingDays: progress.remainingDays,
              enrolledDate: progress.enrolledDate,
              completionDate: progress.completionDate,
            };
          })
          .filter(Boolean);
    
        return res.status(200).json({
          success: true,
          courses,
        });
    }
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
