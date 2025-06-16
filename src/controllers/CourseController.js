const expressAsyncHandler = require("express-async-handler");
const Course = require("../models/CourseSchemas/courseModel");
const Module = require("../models/CourseSchemas/CourseModule");
const Video = require("../models/CourseSchemas/VideoModel");
const Test = require("../models/CourseSchemas/testModel");
const User = require("../models/users");
const multer = require("multer");
const Progress = require("../models/CourseSchemas/courseSatusModel");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const mongoose = require("mongoose");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const createCourse = expressAsyncHandler(async (req, res) => {
  try {
    const { title, description, category, price, compulsory } = req.body; 
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Thumbnail is required" });
    }

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "course_thumbnails",
            resource_type: "image",
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
    if (!user || user.role !== "instructor") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only instructors can create courses",
        });
    }

    const course = await Course.create({
      title,
      description,
      category,
      price,
      instructor: user._id,
      instructorName: user.name,
      thumbnail: uploadResult.secure_url,
      compulsory: compulsory,
    });

    user.courses.push(course._id);
    await user.save();

    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error("Error in createCourse:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while creating course" });
  }
});

const createModule = expressAsyncHandler(async (req, res) => {
  console.log("➡️ createModule controller triggered");
  try {
    const { title, description, courseId } = req.body;
    console.log(
      "this is the   data from the   creteMdule  Controller, : ",
      title,
      description,
      courseId
    );
    const user = await User.findById(req.user._id);

    if (!user || user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructors can create modules",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
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
      module,
    });
  } catch (error) {
    console.error("Error in createModule:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating module",
    });
  }
});

const createVideo = expressAsyncHandler(async (req, res) => {
  const { title, description, courseId, moduleId, duration } = req.body;

  if (!title || !description || !courseId || !moduleId || !duration) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Video file is required" });
  }

  const user = await User.findById(req.user._id);
  if (!user || user.role !== "instructor") {
    return res
      .status(403)
      .json({ success: false, message: "Only instructors can upload videos" });
  }

  const course = await Course.findById(courseId);
  const module = await Module.findById(moduleId);
  if (!course || !module) {
    return res
      .status(404)
      .json({ success: false, message: "Course or module not found" });
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "video", folder: "LMS_videos" },
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

  console.log("test data  is : ", testData);
  try {
    if (!testData) {
      return res.status(400).json({
        success: false,
        message: "Test data is missing",
      });
    }
    const linkedModeule = await Module.findById(testData.module);
    const questiondata = testData.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options.map((opt) => ({ optionText: opt })),
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
    await linkedModeule.save();
    res.status(201).json({
      success: true,
      message: "Test added successfully",
      test: newTest,
    });
  } catch (error) {
    console.error("Error adding test:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

const getCourses = expressAsyncHandler(async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("Error in getCourses:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses",
    });
  }
});

const getModulesByCourseId = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;

  if (!courseId) {
    return res
      .status(400)
      .json({ success: false, message: "Course ID is required" });
  }

  try {
    const modules = await Module.find({ course: courseId }).populate("videos");
    res.status(200).json({ success: true, modules });
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ success: false, message: "Error fetching modules" });
  }
});

const getCourseByCourseId = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!courseId) {
    return res
      .status(400)
      .json({ success: false, message: "Course ID is required" });
  }
  try {
    const course = await Course.findById(courseId).populate("modules");

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, course });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ success: false, message: "Error fetching course" });
  }
});

const getVideosByModuleId = expressAsyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  if (!moduleId) {
    return res
      .status(400)
      .json({ success: false, message: "Module ID is required" });
  }

  try {
    const videos = await Video.find({ module: moduleId });
    res.status(200).json({ success: true, videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ success: false, message: "Error fetching videos" });
  }
});

const getModuleById = expressAsyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  if (!moduleId) {
    return res
      .status(400)
      .json({ success: false, message: "Module ID is required" });
  }
  try {
    const module = await Module.findById(moduleId)
      .populate("videos")
      .populate("tests");

    if (!module) {
      return res
        .status(404)
        .json({ success: false, message: "Module not found" });
    }

    res.status(200).json({ success: true, module });
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ success: false, message: "Error fetching module" });
  }
});

const testSubmit = expressAsyncHandler(async (req, res) => {
const { testId, userAnswers, progressId, moduleId } = req.body;

  console.log("testSubmit data:", { testId, userAnswers });

  if (!testId || !userAnswers || !progressId || !moduleId) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Test ID, user Answers, Module ID, and Progress ID are required",
      });
  }

  try {
    const test = await Test.findById(testId);
    if (!test)
      return res
        .status(404)
        .json({ success: false, message: "Test not found" });

    const questions = test.questions;
    if (questions.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "No questions found" });

    let correctCount = 0;
    Object.entries(userAnswers).forEach(([index, answer]) => {
      const i = parseInt(index);
      if (questions[i] && questions[i].correctAnswer === answer) correctCount++;
    });

    const score = correctCount;

    const progress = await Progress.findById(progressId);
    if (!progress)
      return res
        .status(404)
        .json({ success: false, message: "Progress not found" });

    const module = progress.moduleProgress.find(
      (x) => x.module.toString() === moduleId
    );
    if (!module)
      return res
        .status(404)
        .json({ success: false, message: "Module not found" });

    const targetTestData = module.testStatus.find(
      (x) => x.test.toString() === testId
    );
    if (!targetTestData)
      return res
        .status(404)
        .json({ success: false, message: "Test not found in module" });

    targetTestData.isCompleted = true;
    targetTestData.marksScored = score;
    targetTestData.retakeCount = (targetTestData.retakeCount || 0) + 1;

    await progress.save();

    return res.status(200).json({ success: true, score });
  } catch (error) {
    console.error("Error in testSubmit:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

const enrollCourse = expressAsyncHandler(async (req, res) => {
  const { courseId, userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid course ID." });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid user ID." });
  }

  try {
    const course = await Course.findById(courseId).populate("modules");
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const existingProgress = await Progress.findOne({
      course: courseId,
      user: userId,
    });
    if (existingProgress) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User already enrolled in this course",
        });
    }

    const moduleProgressPromises = course.modules.map(async (module) => {
      const fullModule = await Module.findById(module._id)
        .populate("videos")
        .populate("tests");

      const videoProgress = fullModule.videos.map((video) => ({
        video: video._id,
        status: "not-started",
      }));

      const testStatus = fullModule.tests.map((test) => ({
        test: test._id,
        isCompleted: false,
        retakeCount: 0,
        marksScored: 0,
      }));

      return {
        module: fullModule._id,
        status: "not-started",
        videoIndex: 0,
        percentageCompleted: 0,
        videoProgress,
        testStatus,
      };
    });

    const moduleProgress = await Promise.all(moduleProgressPromises);

    const newProgress = new Progress({
      user: userId,
      course: courseId,
      status: "enrolled",
      overallPercentage: 0,
      isCourseCompleted: false,
      moduleProgress,
    });

    await newProgress.save();

    if (!course.students.includes(userId)) {
      course.students.push(userId);
      await course.save();
    }

    if (!user.courses.includes(courseId)) {
      user.courses.push(courseId);
      await user.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Course enrolled successfully." });
  } catch (error) {
    console.error("Error in enrollCourse:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

const  getCourseProgress =  expressAsyncHandler(async(req , res) =>{
    const { courseId , userId } = req.body;

    try {
       const  progress =   await Progress.findOne({ user: userId , course: courseId }).populate("moduleProgress");
       if (!progress) {
        return res.status(404).json({ success: false, message: "Progress not found"});
       }
       res.status(200).json({success:true , progress})
    }catch (error) {
      console.error("Error in enrollCourse:", error);
    return res.status(500).json({ success: false, message: "Server error" });
    }
})

module.exports = {
  createCourse,
  createModule,
  createVideo,
  createTest,
  getCourses,
  getModulesByCourseId,
  getCourseByCourseId,
  getVideosByModuleId,
  getModuleById,
  testSubmit,
  enrollCourse,
  getCourseProgress
};
