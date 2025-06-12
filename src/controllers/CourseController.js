const expressAsyncHandler = require('express-async-handler');
const Course = require('../models/CourseSchemas/courseModel');
const Module = require('../models/CourseSchemas/CourseModule');
const Video = require('../models/CourseSchemas/VideoModel');
const Test = require('../models/CourseSchemas/testModel');
const User = require('../models/users');
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');



const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const createCourse = expressAsyncHandler(async (req, res) => {
  try {
    const { title, description, category, price , compulsory } = req.body;  // now fields come from multipart form-data
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Thumbnail is required' });
    }

    // Upload to cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'course_thumbnails',
            resource_type: 'image',
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    const uploadResult = await streamUpload(file.buffer);

    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'instructor') {
      return res.status(403).json({ success: false, message: 'Only instructors can create courses' });
    }

    const course = await Course.create({
      title,
      description,
      category,
      price,
      instructor: user._id,
      instructorName: user.name,
      thumbnail: uploadResult.secure_url,
      compulsory:compulsory
    });

    user.courses.push(course._id);
    await user.save();

    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error("Error in createCourse:", error);
    res.status(500).json({ success: false, message: 'Server error while creating course' });
  }
});

const createModule = expressAsyncHandler(async (req, res) => {
  console.log('➡️ createModule controller triggered');
  try {
    const { title, description, courseId } = req.body;
    console.log('this is the   data from the   creteMdule  Controller, : ', title, description, courseId)
    const user = await User.findById(req.user._id);

    if (!user || user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Only instructors can create modules'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const module = await Module.create({
      title,
      description,
      course: courseId,
    });

    course.modules.push(module._id);
    await course.save();

    res.status(201).json({
      success: true,
      module
    });

  } catch (error) {
    console.error("Error in createModule:", error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating module'
    });
  }
});

const createVideo = expressAsyncHandler(async (req, res) => {
  const { title, description, courseId, moduleId, duration } = req.body;

  if (!title || !description || !courseId || !moduleId || !duration) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Video file is required' });
  }

  const user = await User.findById(req.user._id);
  if (!user || user.role !== 'instructor') {
    return res.status(403).json({ success: false, message: 'Only instructors can upload videos' });
  }

  const course = await Course.findById(courseId);
  const module = await Module.findById(moduleId);
  if (!course || !module) {
    return res.status(404).json({ success: false, message: 'Course or module not found' });
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'video', folder: 'LMS_videos' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  });

  const video = await Video.create({
    title,
    description,
    url: uploadResult.secure_url,
    course: courseId,
    module: moduleId,
    uploadedBy: user._id,
    duration,
  });

  module.videos.push(video._id);
  await module.save();

  res.status(201).json({ success: true, video });
});

const createTest = expressAsyncHandler(async (req, res) => {
  const { testData } = req.body;
   
    console.log("test data  is : " , testData)
  try {
    if (!testData) {
      return res.status(400).json({
        success: false,
        message: 'Test data is missing',
      });
    }
  const   linkedModeule =    await Module.findById(testData.module);
    const questiondata = testData.questions.map((q) => ({
      questionText: q.questionText,
       options: q.options.map(opt => ({ optionText: opt })), 
      correctAnswer: q.correctAnswer,
    }));

    const newTest = new Test({
      title: testData.title,
      description: testData.description,
      module: testData.module,
      questions: questiondata,
    });


    await newTest.save();
     linkedModeule.tests.push(newTest._id);
     await linkedModeule.save()
    res.status(201).json({
      success: true,
      message: 'Test added successfully',
      test: newTest,
    });
  } catch (error) {
    console.error('Error adding test:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

const getCourses = expressAsyncHandler(async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'name email');
    res.status(200).json({
      success: true,
      courses
    });

  } catch (error) {
    console.error('Error in getCourses:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});


const getModulesByCourseId = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    return res.status(400).json({ success: false, message: 'Course ID is required' });
  }

  try {
    const modules = await Module.find({ course: courseId }).populate('videos');
    res.status(200).json({ success: true, modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ success: false, message: 'Error fetching modules' });
  }
});

const getCourseByCourseId = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!courseId) {
    return res.status(400).json({ success: false, message: 'Course ID is required' });
  }
  try {
    const course = await Course.findById(courseId)
      .populate('modules');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.status(200).json({ success: true, course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ success: false, message: 'Error fetching course' });
  }
});


const getVideosByModuleId = expressAsyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  if (!moduleId) {
    return res.status(400).json({ success: false, message: 'Module ID is required' });
  }

  try {
    const videos = await Video.find({ modeule: moduleId }); // Note the typo in the schema: 'modeule' instead of 'module'
    res.status(200).json({ success: true, videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ success: false, message: 'Error fetching videos' });
  }
});

const getModuleById = expressAsyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  if (!moduleId) {
    return res.status(400).json({ success: false, message: 'Module ID is required' });
  }
  try {
    const module = await Module.findById(moduleId)
      .populate('videos')
      .populate('tests');

    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    res.status(200).json({ success: true, module });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ success: false, message: 'Error fetching module' });
  }
});






module.exports = {
  createCourse,
  createModule,
  createVideo,
  createTest,
  getCourses,
  getModulesByCourseId,
  getCourseByCourseId,
  getVideosByModuleId,
  getModuleById
};