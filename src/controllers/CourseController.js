const expressAsyncHandler = require("express-async-handler");
const Course = require("../models/CourseSchemas/courseModel");
const Module = require("../models/CourseSchemas/CourseModule");
const Video = require("../models/CourseSchemas/VideoModel");
const Test = require("../models/CourseSchemas/testModel");
const User = require("../models/users");
const Progress = require("../models/CourseSchemas/courseSatusModel");
const mongoose = require("mongoose");
const fs = require('fs')
const tmp = require('tmp');
const path = require('path');
const Certificate = require("../models/certificateSchema");
const { uploadToAzureBlob, deleteFromAzureBlob, uploadStreamToAzureBlob } = require("../utils/azureStore");
const { generateBlobSas, generateSasUrl } = require("../utils/generateSasUrl");
// const { getVideoDurationInSeconds } = require('get-video-duration');
const { bufferToStream } = require("../utils/videoBuffer");
const {upload} = require("../middlewares/uploadMiddleware");
const { getDurationFromBuffer } = require("../utils/getVideoDuration");
const courseProgress = require("../models/courseProgressSchemas/courseProgress");
const ModuleProgress = require("../models/courseProgressSchemas/moduleProgress");
const { json } = require("stream/consumers");
const TestProgress = require("../models/courseProgressSchemas/testProgress");
const VideoProgress = require("../models/courseProgressSchemas/videoProgress");
const CourseProgress = require("../models/courseProgressSchemas/courseProgress");
const createCourse = expressAsyncHandler(async (req, res) => {
  try {
    const { title, description, category, price, compulsory , courseDuration , remark} = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Thumbnail is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== "instructor") {
      return res.status(403).json({ success: false, message: "Only instructors can create courses" });
    }

    const thumbnail = await uploadToAzureBlob(file.buffer, file.originalname, file.mimetype);

    const course = await Course.create({
      title,
      description,
      category,
      price,
      instructor: user._id,
      instructorName: user.name,
      thumbnail: thumbnail.url,
      thumbnailBlobName:thumbnail.blobName,
      compulsory: compulsory,
      courseDuration:courseDuration,
      remark:remark,
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
  const { title, description, courseId, moduleId } = req.body;

  if (!req.file || !title || !description || !courseId || !moduleId) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
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

  let duration;
  try {
    duration = await getDurationFromBuffer(req.file.buffer);
    console.log('Video duration:', duration);
  } catch (err) {
    console.error('Failed to get duration:', err);
    return res.status(500).json({ success: false, message: 'Failed to get video duration' });
  }
  
  const videoBlob = await uploadStreamToAzureBlob(req.file.buffer, req.file.originalname, req.file.mimetype);
  console.log('Uploaded video:', videoBlob);
  const video = await Video.create({
    title,
    description,
    url: videoBlob.url,
    videoBlobName: videoBlob.blobName,
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
  const {courseId } = req.params;
  console.log("this is the  course id : " , courseId);
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
 
    if(!targetTestData.isCompleted){
      targetTestData.isCompleted = percentage >= 75;
    }
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

const getCourseProgress = expressAsyncHandler(async (req, res) => {
  const { courseId, userId } = req.body;

  try {
    const progress = await Progress.findOne({ user: userId, course: courseId });

    if (!progress) {
      return res.status(404).json({ success: false, message: "Progress not found" });
    }

    let completedModulesCount = 0;

    progress.moduleProgress.forEach(async (module) => {
      const totalVideos = module.videoProgress.length;
      const totalTests = module.testStatus.length;

      const completedVideos = module.videoProgress.filter(
        (video) => video.status === "completed"
      ).length;
      const completedTests = module.testStatus.filter(
        (test) => test.isCompleted === true
      ).length;

      const allVideosCompleted = completedVideos === totalVideos;
      const allTestsCompleted = completedTests === totalTests;

      if (allVideosCompleted && allTestsCompleted) {
        module.status = "completed";
        completedModulesCount += 1;
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

    progress.overallPercentage = percentage;

    const today = new Date();
    const completionDate = new Date(progress.completionDate);
    const timeDiff = completionDate.getTime() - today.getTime();
    const remainingDays = Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)), 0);

    progress.remainingDays = remainingDays;
    if (percentage === 100) {
      progress.isCourseCompleted = true;
      progress.status = "completed";
    } else {
      progress.isCourseCompleted = false;
      if (remainingDays === 0) {
        progress.status = "expired";
      } else {
        progress.status = "pending";
      }
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


const updateVideoCompletion = expressAsyncHandler(async (req, res) => {
  const { courseId, videoId, moduleId } = req.body;
  const userId = req.user._id;

  try {
    const videoProgress = await VideoProgress.findOne({ userId, courseId, moduleId, videoId });

    if (!videoProgress) {
      return res.status(404).json({ success: false, message: 'Video progress not found' });
    }

    const wasCompleted = videoProgress.status === 'completed';
    if (!wasCompleted) {
      videoProgress.status = 'completed';
      videoProgress.lastWatchedTime = videoProgress.videoDuration || videoProgress.lastWatchedTime;
      await videoProgress.save();

      const moduleProgress = await ModuleProgress.findOne({ userId, courseId, moduleId });

      if (moduleProgress) {
        moduleProgress.completedVideos += 1;

        const totalItems = moduleProgress.totalVideos + moduleProgress.totalTests;
        const completedItems = moduleProgress.completedVideos + moduleProgress.completedTest;
        moduleProgress.percentageCompleted = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

        if (moduleProgress.completedVideos >= moduleProgress.totalVideos) {
          moduleProgress.status = 'completed';
        } else {
          moduleProgress.status = 'in-progress';
        }

        await moduleProgress.save();
      }
    }

    const updatedVideoProgress = await VideoProgress.findOne({ _id: videoProgress._id });
    const updatedModuleProgress = await ModuleProgress.findOne({ userId, courseId });
    const newTestProgress = await TestProgress.findOne({ userId, courseId, moduleId });
    const courseProgress = await CourseProgress.findOne({ userId, courseId });

    return res.status(200).json({
      success: true,
      message: 'Video marked as completed',
      videoProgress: updatedVideoProgress,
      moduleProgress: updatedModuleProgress,
      testProgress: newTestProgress,
      courseProgress,
    });

  } catch (error) {
    console.error('Error marking video as complete:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
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

const  deleteCourse = expressAsyncHandler(async(req, res)=>{
  const {courseId} = req.params;
  const userId = req.user._id.toString();
  console.log("user id id : ", userId);
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: "Invalid course ID." });
  }
  try {
    const course = await Course.findById(courseId).populate('modules');
    console.log("course istructor is : " , course.instructor)
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }
    const instructorId = course.instructor.toString();
    if (instructorId !== userId) {
      console.log("this is called ")
      return res.status(403).json({ success: false, message: "You are not authorized to delete this course." });
    }
    
    for(const modules of course.modules){
      const  module = await Module.findById(modules._id).populate(['videos', 'tests']);
      if(module){
        for(const video of module.videos){
          await deleteFromAzureBlob( video.videoBlobName);
          await Video.findByIdAndDelete(video._id);
        }
        for(const test of module.tests){
          await deleteFromAzureBlob( test.testBlobName);
          await Test.findByIdAndDelete(test._id);
        }
      }
      await Module.findByIdAndDelete(module._id);
    }
    await deleteFromAzureBlob( course.thumbnailBlobName);
    await User.updateMany(  
      { courses: courseId },
      { $pull: { courses: courseId } }
    );
    await Course.findByIdAndDelete(courseId);
    await Progress.deleteMany({ course: courseId });

    res.status(200).json({ success: true, message: "Course deleted successfully."  });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});


const deleteModule = expressAsyncHandler(async (req, res) => {
  const { moduleId } = req.params;
  const userId = req.user._id.toString();

  try {
    const module = await Module.findById(moduleId).populate(['videos', 'tests']);
    if (!module) {
      return res.status(404).json({ success: false, message: 'Module not found.' });
    }

    const course = await Course.findById(module.course);
    if (!course || course.instructor.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this module." });
    }
    for (const video of module.videos) {
      if (video.videoBlobName) {
        try {
          await deleteFromAzureBlob(video.videoBlobName);
        } catch (err) {
          console.warn(`Failed to delete video blob: ${video.videoBlobName}`, err.message);
        }
      }
      await Video.findByIdAndDelete(video._id);
    }

    for (const test of module.tests) {
      await Test.findByIdAndDelete(test._id);
    }
    await Module.findByIdAndDelete(moduleId);
    await Course.findByIdAndUpdate(module.course, {
      $pull: { modules: module._id }
    });

    res.status(200).json({ success: true, message: 'Module deleted successfully.' });

  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

const deleteTest = expressAsyncHandler(async (req, res) => {
  const { testId } = req.params;
  const userId = req.user._id.toString();

  try {
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }
    const module = await Module.findById(test.module);
    const course = await Course.findById(module?.course);
    if (!course || course.instructor.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this test." });
    }
    await Module.findByIdAndUpdate(test.module, {
      $pull: { tests: test._id }
    });

    await Test.findByIdAndDelete(testId);

    res.status(200).json({ success: true, message: 'Test deleted successfully.' });

  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});
const deleteVideo = expressAsyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id.toString();
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    const module = await Module.findById(video.module);
    const course = await Course.findById(module?.course);
    if (!course || course.instructor.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this video." });
    }
    if (video.videoBlobName) {
      try {
        await deleteFromAzureBlob(video.videoBlobName);
      } catch (err) {
        console.warn(`Failed to delete video blob: ${video.videoBlobName}`, err.message);
      }
    }
    await Module.findByIdAndUpdate(video.module, {
      $pull: { videos: video._id }
    });
    await Video.findByIdAndDelete(videoId);
    res.status(200).json({ success: true, message: 'Video deleted successfully' });

  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
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
    let html = fs.readFileSync(templatePath, 'utf8');

    html = html
      .replace('Adi Jain', name)
      .replace('EMP-789654', empId)
      .replace('DV-2024-001', certificateId)
      .replace('"Python"', `"${courseTitle}"`)
      .replace('June 16, 2025', awardedDate);

    const newCertificate = await Certificate.create({
      user: userId,
      course: courseId,
      certificateType,
      issueDate: new Date(),
      isGenerated: true,
      certificateHtml: html, 
    });

    res.status(200).json({
      success: true,
      message: 'Certificate HTML generated and stored in database successfully.',
      certificate: newCertificate
    });

  } catch (error) {
    console.error('Certificate generation failed:', error);
    res.status(500).json({ success: false, message: 'Error generating certificate' });
  }
}); 

const generateSASToken = expressAsyncHandler(async (req, res) => {
  const blobName = req.params.blobName;
  
  console.log("Generating SAS token for blob:", blobName);
  const hours = parseInt(req.query.hours) || 1;
  const expiresInMinutes = hours * 60;

  try {
    const sasToken = await generateSasUrl({ blobName, expiresInMinutes });
    res.status(200).json({ success: true, sasToken });
  } catch (error) {
    console.error('Error generating SAS token:', error);
    res.status(500).json({ success: false, message: 'Error generating SAS token' });
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
  getCourseProgress,
  updateVideoCompletion,
  createUserProgressForNewModule,
  checkVideoOrTestInUserProgressSchema,
  generateCertificate,
  deleteCourse,
  deleteVideo,
  deleteModule,
  deleteTest,
  generateSASToken,
};