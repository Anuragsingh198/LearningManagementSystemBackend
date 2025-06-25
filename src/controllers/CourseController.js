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
const puppeteer = require('puppeteer');
const fs = require('fs')
const path = require('path');
const Certificate = require("../models/certificateSchema");
const { uploadToAzureBlob } = require("../utils/azureStore");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const createCourse = expressAsyncHandler(async (req, res) => {
  try {
    const { title, description, category, price, compulsory } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "Thumbnail is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== "instructor") {
      return res.status(403).json({ success: false, message: "Only instructors can create courses" });
    }

    const thumbnailUrl = await uploadToAzureBlob(file.buffer, file.originalname, file.mimetype);

    const course = await Course.create({
      title,
      description,
      category,
      price,
      instructor: user._id,
      instructorName: user.name,
      thumbnail: thumbnailUrl,
      compulsory: compulsory,
    });

    user.courses.push(course._id);
    await user.save();

    res.status(201).json({ success: true, course });
  } catch (error) {
    console.error("Error in createCourse:", error);
    res.status(500).json({ success: false, message: "Server error while creating course" });
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

  if (!title || !description || !courseId || !moduleId || !duration || !req.file) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const user = await User.findById(req.user._id);
  if (!user || user.role !== "instructor") {
    return res.status(403).json({ success: false, message: "Only instructors can upload videos" });
  }

  const course = await Course.findById(courseId);
  const module = await Module.findById(moduleId);
  if (!course || !module) {
    return res.status(404).json({ success: false, message: "Course or module not found" });
  }

  const videoUrl = await uploadToAzureBlob(req.file.buffer, req.file.originalname, req.file.mimetype);

  const video = await Video.create({
    title,
    description,
    url: videoUrl,
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
      return res.status(404).json({ success: false, message: "Test not found" });

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
    const percentage = (score / questions.length) * 100;

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


    targetTestData.isCompleted = percentage >= 75;
    targetTestData.marksScored = score;
    targetTestData.retakeCount = (targetTestData.retakeCount || 0) + 1;

    if (targetTestData.isCompleted) {
      const allVideosCompleted = module.videoProgress.every(
        (video) => video.status === "completed"
      );
      const allTestsCompleted = module.testStatus.every(
        (test) => test.isCompleted === true
      );

      if (allVideosCompleted && allTestsCompleted) {
        module.status = "completed";
      }
    }


    await progress.save();

    return res.status(200).json({ success: true, score });
  } catch (error) {
    console.error("Error in testSubmit:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

const enrollCourse = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user._id;

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


const getCourseProgress = expressAsyncHandler(async (req, res) => {
  const { courseId, userId } = req.body;
  // console.log('get course progress called');

  try {
    const progress = await Progress.findOne({ user: userId, course: courseId });

    if (!progress) {
      return res.status(404).json({ success: false, message: "Progress not found" });
    }

    let completedModulesCount = 0;
    // console.log('completed module count before: ', completedModulesCount);

    // Iterate through each moduleProgress to update statuses
    progress.moduleProgress.forEach((module) => {
      //  if (module.status === "completed") return;
      const totalVideos = module.videoProgress.length;
      const totalTests = module.testStatus.length;
      console.log('total number of completed videos are: ', totalVideos)
      console.log('total number of completed tests are: ', totalTests)

      const completedVideos = module.videoProgress.filter(
        (video) => video.status === "completed"
      ).length;

      const completedTests = module.testStatus.filter(
        (test) => test.isCompleted === true
      ).length;

      console.log('number of completed videos are: ', completedVideos)
      console.log('number of completed tests are: ', completedTests)


      const allVideosCompleted = completedVideos === totalVideos;
      const allTestsCompleted = completedTests === totalTests;

      console.log('boolean value for allVideoCompleted is: ', allVideosCompleted)
      console.log('boolean value for allTestCompleted is: ', allTestsCompleted)

      if (allVideosCompleted && allTestsCompleted) {
        module.status = "completed";
        completedModulesCount += 1;
        console.log('completed module count incremented:', completedModulesCount);
      } else if (completedVideos === 0 && completedTests === 0) {
        module.status = "not-started";
      } else {
        module.status = "in-progress";
      }
    });


    const totalModules = progress.moduleProgress.length;
    const percentage =
      totalModules > 0
        ? Math.round((completedModulesCount / totalModules) * 100)
        : 0;

    // console.log('overall percentage check: ', percentage);
    progress.overallPercentage = percentage;

    // Optional: mark course completed if all modules are done
    if (percentage === 100) {
      // console.log('entered if condition');
      progress.isCourseCompleted = true;
      progress.status = "completed";
    } else {
      // console.log('entered else condition', percentage);
      progress.isCourseCompleted = false;
      progress.status = "pending"; 
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: 'Data from course progress fetched',
      progress,
    });
  } catch (error) {
    console.error("Error in getCourseProgress:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});




const updateVideoProgress = expressAsyncHandler(async (req, res) => {
  // console.log('update video progress controller called');
  const { courseId, videoId, moduleId } = req.body;
  const userId = req.user._id;

  try {
    const progress = await Progress.findOne({ user: userId, course: courseId });

    if (!progress) {
      return res.status(404).json({ success: false, message: "Progress not found" });
    }

    let moduleUpdated = false;

    // Find the specific module by moduleId
    const targetModule = progress.moduleProgress.find(
      m => m.module.toString() === moduleId
    );

    if (!targetModule) {
      return res.status(404).json({ success: false, message: "Module not found in progress" });
    }

    // Find the video inside the matched module
    const video = targetModule.videoProgress.find(v => v.video.toString() === videoId);

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found in specified module" });
    }

    if (video.status === "completed") {
      return res.status(200).json({ success: true, message: "Video already marked as completed" });
    }

    // Step 1: Update video status
    video.status = "completed";
    moduleUpdated = true;

    // Step 2: Check if all videos are completed
    const allVideosCompleted = targetModule.videoProgress.every(v => v.status === "completed");

    // Step 3: Check if all tests are completed
    const allTestsCompleted = targetModule.testStatus.every(t => t.isCompleted === true);

    if (allVideosCompleted && allTestsCompleted) {
      targetModule.percentageCompleted = 100;
      targetModule.status = "completed";
    }

    await progress.save();

    return res.status(200).json({
      success: true,
      message: "Video progress updated",
      progress,
    });

  } catch (error) {
    console.error("Error in updating video progress:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || "Something went wrong"
    });
  }
});

const createUserProgressForNewModule = expressAsyncHandler(async (req, res) => {
  const { courseId, chapterId } = req.body;
  const userId = req.user._id;

  const progress = await Progress.findOne({ user: userId, course: courseId });

  if (!progress) {
    return res.status(404).json({ success: false, message: "Progress not found" });
  }

  const existingModule = progress.moduleProgress.find(mod => mod.module.toString() === chapterId);

  if (existingModule) {
    return res.status(200).json({ success: true, message: "Module already exists in progress", progress });
  }

  const module = await Module.findById(chapterId).populate('videos').populate('tests');

  if (!module) {
    return res.status(404).json({ success: false, message: "Module not found" });
  }

  // Prepare videoProgress and testStatus arrays
  const videoProgress = (module.videos || []).map(video => ({
    video: video._id,
    status: "not-started"
  }));

  const testStatus = (module.tests || []).map(test => ({
    test: test._id,
    isCompleted: false,
    retakeCount: 0,
    marksScored: 0
  }));

  const newModuleProgress = {
    module: chapterId,
    status: 'not-started',
    videoIndex: 0,
    percentageCompleted: 0,
    videoProgress,
    testStatus
  };

  progress.moduleProgress.push(newModuleProgress);

  await progress.save();


  return res.status(200).json({
    success: true,
    message: "updated user progress successfully",
    progress,
    module
  })

});


const checkVideoOrTestInUserProgressSchema = expressAsyncHandler(async (req, res) => {
  const { videoId, courseId, moduleId, testId } = req.body;
  const userId = req.user._id;

  const progress = await Progress.findOne({ user: userId, course: courseId });

  if (!progress) {
    return res.status(404).json({ success: false, message: "Progress not found" });
  }

  // Find the module in the moduleProgress array
  const moduleProgress = progress.moduleProgress.find(
    (mod) => mod.module.toString() === moduleId
  );

  if (!moduleProgress) {
    return res.status(404).json({ success: false, message: "Module progress not found" });
  }

  // Check if video already exists in videoProgress
  if (videoId) {
    const videoExists = moduleProgress.videoProgress.some(
      (vp) => vp.video.toString() === videoId
    );

    if (videoExists) {
      return res.status(200).json({
        success: true,
        message: "Video already exists in user progress",
        progress,
      });
    }

    moduleProgress.videoProgress.push({
      video: videoId,
      status: "in-progress",
    });

    await progress.save();

    return res.status(200).json({
      success: true,
      message: "Video added to progress successfully",
      progress,
    });
  }

  if (testId) {
    const testExists = moduleProgress.testStatus.some(
      (test) => test.test.toString() === testId
    );

    if (testExists) {
      return res.status(200).json({
        success: true,
        message: "Test already exists in user progress",
        progress,
      });
    }

    moduleProgress.testStatus.push({
      test: testId,
      isCompleted: false,
      retakeCount: 0,
      marksScored: 0,
    });

    await progress.save();

    return res.status(200).json({
      success: true,
      message: "Test added to progress successfully",
      progress,
    });
  }

  return res.status(400).json({
    success: false,
    message: "Neither videoId nor testId provided",
  });


});



const generateCertificate = expressAsyncHandler(async (req, res) => {
  const { name, courseTitle, empId, courseId, certificateType } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: "Invalid course ID." });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }

  try {

    const existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
    if (existingCertificate) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already exists.',
        certificate: existingCertificate
      });
    }

    const certificateId = `CERT-${Date.now()}`;
    const awardedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const templatePath = path.join(__dirname, '../templates/certificatetemplate.html');
    console.log("Template Path:", templatePath);

    let html = fs.readFileSync(templatePath, 'utf8');

    html = html
      .replace('Adi Jain', name)
      .replace('EMP-789654', empId)
      .replace('DV-2024-001', certificateId)
      .replace('"Python"', `"${courseTitle}"`)
      .replace('June 16, 2025', awardedDate);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });
    await browser.close();

    const azureUrl = await uploadToAzureBlob(pdfBuffer, `${certificateId}.pdf`, 'application/pdf');

    const newCertificate = await Certificate.create({
      user: userId,
      course: courseId,
      certificateUrl: azureUrl,
      issueDate: new Date(),
      certificateType,
      isGenerated: true
    });

    res.status(200).json({
      success: true,
      message: 'Certificate generated and uploaded to Azure successfully.',
      certificate: newCertificate
    });

  } catch (error) {
    console.error('Certificate generation failed:', error);
    return res.status(500).json({ success: false, message: 'Error generating certificate', error });
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
  getModuleById,
  testSubmit,
  enrollCourse,
  getCourseProgress,
  updateVideoProgress,
  createUserProgressForNewModule,
  checkVideoOrTestInUserProgressSchema,
  generateCertificate
};