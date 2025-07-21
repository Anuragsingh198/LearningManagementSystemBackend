const expressAsyncHandler = require('express-async-handler');
const Course = require('../models/CourseSchemas/courseModel');
const Module = require('../models/CourseSchemas/CourseModule');
const Video = require('../models/CourseSchemas/VideoModel');
const Test = require('../models/CourseSchemas/testModel');
const User = require('../models/users');
const mongoose = require('mongoose');
const courseProgress = require('../models/courseProgressSchemas/courseProgress');
const ModuleProgress = require('../models/courseProgressSchemas/moduleProgress');
const VideoProgress = require('../models/courseProgressSchemas/videoProgress');
const TestProgress = require('../models/courseProgressSchemas/testProgress');
const CourseProgress = require('../models/courseProgressSchemas/courseProgress');
// const Progress = require('../models/CourseSchemas/courseSatusModel');

const getCoursesByUserId = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;

  console.log("this is the user from getCoursesByUserId:", userId);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid user ID is required.',
    });
  }
  const user = await User.findById(userId).populate('courses');

  // If user is not found
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Check role and return appropriate courses
  if (user.role === 'instructor') {
    return res.status(200).json({
      success: true,
      message: 'Uploaded courses fetched',
      adminCourses: user.courses,
    });
  }

  try {
    const coursesWithProgress = await CourseProgress.find({ userId }).populate('courseId');

    if (!coursesWithProgress || coursesWithProgress.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No registered courses found.',
        courses: [],
      });
    }

    const courses = coursesWithProgress.map((progress) => {
      const course = progress.courseId;
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
        status: progress.status,
        overallPercentage: progress.overallPercentage,
        isCourseCompleted: progress.isCourseCompleted,
        remainingDays: progress.remainingDays,
        enrolledDate: progress.enrolledDate,
        completionDate: progress.completionDate,
        totalModules: progress.totalModules,
        completedModules: progress.completedModules,
      };
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      message: 'Courses with progress fetched successfully.',
      courses,
    });

  } catch (error) {
    console.error('Error in finding courses for user:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching user courses.',
      error: error.message,
    });
  }
});

const enrollCourse = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid course or user ID." });
  }

  try {
    const course = await Course.findById(courseId).populate('instructor');
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const existingProgress = await CourseProgress.findOne({ courseId, userId });
    if (existingProgress) {
      return res.status(200).json({
        success: true,
        message: "User is already enrolled in this course.",
        alreadyEnrolled: true,
        courseProgress: existingProgress
      });
    }

    const enrolledDate = new Date();
    const durationInDays = course.courseDuration || 30;
    const completionDate = new Date(enrolledDate.getTime() + durationInDays * 24 * 60 * 60 * 1000);

    const newProgress = new CourseProgress({
      userId,
      courseId,
      status: "enrolled",
      overallPercentage: 0,
      isCourseCompleted: false,
      remainingDays: durationInDays,
      enrolledDate,
      completionDate,
      totalModules: course.modules?.length || 0,
      completedModules: 0,
      courseInstructor: course.instructor._id  
    });

    await newProgress.save();

    if (!course.students.some(id => id.toString() === userId.toString())) {
      course.students.push(userId);
      await course.save();
    }

    if (!user.courses.some(id => id.toString() === courseId.toString())) {
      user.courses.push(courseId);
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: "Course enrolled successfully.",
      courseProgress: newProgress,
      alreadyEnrolled: false
    });

  } catch (error) {
    console.error("Error in enrollCourse:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});




const moduleProgress = expressAsyncHandler(async (req, res) => {
  const { courseId, moduleId, moduleData } = req.body;
  console.log(" this is the  module data : ",moduleData );
  const userId = req.user._id;

  try {
const currentModule = await Module.findById(moduleId);
let moduleProgress = await ModuleProgress.findOne({ userId, courseId, moduleId });

let alreadyInitialized = true;
if (!moduleProgress) {
  alreadyInitialized = false;
  moduleProgress = new ModuleProgress({
    userId,
    courseId,
    moduleId,
    status: currentModule?.status || 'not-started',
    videoIndex: currentModule?.currentVideoIndex || 0,
    totalVideos: currentModule?.videos.length || 0,
    totalTests: currentModule?.tests.length || 0,
    completedVideos: 0,
    completedTest: 0,
    percentageCompleted: 0
  });

  await moduleProgress.save();
    }
    const courseProgress = await CourseProgress.findOne({ userId, courseId });
    const videoProgress = await VideoProgress.find({ userId, courseId });
    const testProgress = await TestProgress.find({ userId, courseId });
    const moduleProgressList = await ModuleProgress.find({ userId, courseId });

    return res.status(200).json({
      success: true,
      message: alreadyInitialized
        ? 'Existing module progress returned.'
        : 'Module progress initialized successfully',
      moduleProgress,
      courseProgress,
      videoProgress,
      testProgress,
      moduleProgressList,
    });

  } catch (error) {
    console.error(' Error in moduleProgress:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


const getCourseWithProgress = expressAsyncHandler(async (req, res) => {
  const { courseId, userId } = req.body;

  if (!courseId || !userId) {
    return res.status(400).json({
      success: false,
      message: 'courseId and userId are required.'
    });
  }

  try {
    const course = await Course.findById(courseId).populate('modules');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const courseProgress = await CourseProgress.findOne({ courseId, userId });
    const moduleProgress = await ModuleProgress.find({ courseId, userId });
    const testProgress = await TestProgress.find({ courseId, userId });
    const videoProgress = await VideoProgress.find({ courseId, userId });

    return res.status(200).json({
      success: true,
      message: 'Course and progress data fetched successfully.',
      course,
      progress: {
        courseProgress,
        moduleProgress,
        testProgress,
        videoProgress
      }
    });

  } catch (error) {
    console.error('Error in getCourseWithProgress:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


const videoProgress = expressAsyncHandler(async (req, res) => {
  const { courseId, videoId, moduleId, videoData } = req.body;
  const userId = req.user._id;
  console.log("This is the  data form  videoProgres: ",courseId._id,videoId , moduleId );
  try {
    let existingProgress = await VideoProgress.findOne({ userId, courseId, moduleId, videoId });

    if (!existingProgress) {
      existingProgress = new VideoProgress({
        userId,
        courseId,
        moduleId,
        videoId,
        videoDuration: videoData?.videoDuration || 0,
        status: 'in-progress',
        lastWatchedTime: videoData?.lastWatchedTime || 0,
      });
      await existingProgress.save();
    }


    const courseProgress = await CourseProgress.findOne({ userId, courseId });
    const moduleProgress = await ModuleProgress.find({ userId, courseId });
    const videoProgress = await VideoProgress.find({ userId, courseId });
    const testProgress = await TestProgress.find({ userId, courseId });
     console.log("this is  the  video data : video progress data ",courseProgress )
    return res.status(200).json({
      success: true,
      message: 'Video progress handled successfully',
      videoProgress: existingProgress,
      courseProgress,
      moduleProgress,
      testProgress,
      videoProgressList: videoProgress,
    });
  } catch (error) {
    console.error('Error in videoProgress:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


const testProgress = expressAsyncHandler(async (req, res) => {
  const { courseId, testId, moduleId, testData } = req.body;
  const userId = req.user._id;

  console.log('course id is: ', courseId)
  console.log('test id is: ', testId)

  console.log('module id is: ', moduleId)
  console.log('testdata id is: ', testData )
  console.log('testdata id is: ', userId )



  try {
    let existingProgress = await TestProgress.findOne({ userId, courseId, moduleId, testId });
  console.log("this is the  existing  test progress : " , existingProgress)
    if (!existingProgress) {
      console.log('we are in if block')
      existingProgress = new TestProgress({
        userId,
        courseId,
        moduleId,
        testId,
        status: 'in-progress',
        lastAttemptedTime: new Date(),
        score: testData?.score || 0,
        isPassed: testData?.isPassed || false,
        retakeCount: testData?.retakeCount || 0,
        yourAnswers: testData?.yourAnswers || [],
      });

      await existingProgress.save();
    }


    const courseProgress = await CourseProgress.findOne({ userId, courseId });
    const moduleProgressList = await ModuleProgress.find({ userId, courseId });
    const videoProgressList = await VideoProgress.find({ userId, courseId , moduleId });
    const testProgressList = await TestProgress.find({ userId, courseId , moduleId});

    return res.status(200).json({
      success: true,
      message: 'Test progress initialized successfully',
      testProgress: existingProgress,
      alreadyInitialized: !!existingProgress._id,
      courseProgress,
      moduleProgress: moduleProgressList,
      videoProgress: videoProgressList,
      testProgressList,
      message: 'this is the test progress, check is passed in testProgress'
    });

  } catch (error) {
    console.error('Error in testProgress:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});



module.exports = {
  getCoursesByUserId,
  enrollCourse,
  moduleProgress,
  videoProgress,
  testProgress,
  getCourseWithProgress
};
