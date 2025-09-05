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
const { upload } = require("../middlewares/uploadMiddleware");
const { getDurationFromBuffer } = require("../utils/getVideoDuration");
const courseProgress = require("../models/courseProgressSchemas/courseProgress");
const ModuleProgress = require("../models/courseProgressSchemas/moduleProgress");
const { json } = require("stream/consumers");
const TestProgress = require("../models/courseProgressSchemas/testProgress");
const VideoProgress = require("../models/courseProgressSchemas/videoProgress");
const CourseProgress = require("../models/courseProgressSchemas/courseProgress");
const Article = require("../models/CourseSchemas/articlesModel");
const Assessment = require("../models/CourseSchemas/mainAssessmentModal");
const AssessmentProgress = require("../models/courseProgressSchemas/assessmentProgress");
const createCourse = expressAsyncHandler(async (req, res) => {
  try {
    const { title, description, category, price, compulsory, courseDuration, remark } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Thumbnail is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== "instructor") {
      return res.status(403).json({ success: false, message: "Only instructors can create courses" });
    }

    const thumbnail = await uploadStreamToAzureBlob(file.buffer, file.originalname, file.mimetype);

    const course = await Course.create({
      title,
      description,
      category,
      price,
      instructor: user._id,
      instructorName: user.name,
      thumbnail: thumbnail.url,
      thumbnailBlobName: thumbnail.blobName,
      compulsory: compulsory,
      courseDuration: courseDuration,
      remark: remark,
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
  // console.log("➡️ createModule controller triggered");
  try {
    const { title, description, courseId } = req.body;
    // console.log(
    //   "this is the   data from the   creteMdule  Controller, : ",
    //   title,
    //   description,
    //   courseId
    // );
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
    // console.log('Video duration:', duration);
  } catch (err) {
    console.error('Failed to get duration:', err);
    return res.status(500).json({ success: false, message: 'Failed to get video duration' });
  }

  const videoBlob = await uploadStreamToAzureBlob(req.file.buffer, req.file.originalname, req.file.mimetype, 'videos');
  // console.log('Uploaded video:', videoBlob);
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

const createArticle = expressAsyncHandler(async (req, res) => {
  const { title, description, courseId, moduleId } = req.body;
  // console.log('from create article', title, description, courseId, moduleId)

  if (!req.file || !title || !courseId || !moduleId) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const user = await User.findById(req.user._id);
  if (!user || user.role !== 'instructor') {
    return res.status(403).json({ success: false, message: 'Only instructors can upload Articles' });
  }

  const course = await Course.findById(courseId);
  const module = await Module.findById(moduleId);
  if (!course || !module) {
    return res.status(404).json({ success: false, message: 'Course or module not found' });
  }

  const pdfBlob = await uploadStreamToAzureBlob(req.file.buffer, req.file.originalname, req.file.mimetype, 'articles');

  // console.log('Uploaded Article:', pdfBlob);

  const article = await Article.create({
    title,
    description,
    url: pdfBlob.url,
    articleBlobName: pdfBlob.blobName,
    course: courseId,
    module: moduleId,
    uploadedBy: user._id,
  });

  module.articles.push(article._id);
  await module.save();

  res.status(201).json({ success: true, article });

})


const createTest = expressAsyncHandler(async (req, res) => {
  const { testData } = req.body;

  // console.log("test data  is : ", testData);
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
  // console.log("this is the  course id : ", courseId);
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
      .populate("tests")
      .populate("articles");

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
  const { testId, userAnswers, courseId, moduleId } = req.body;
  const userId = req.user._id;

  if (!testId || !userAnswers || !courseId || !moduleId) {
    return res.status(400).json({
      success: false,
      message: "Test ID, user Answers, Course ID, and Module ID are required",
    });
  }

  try {
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    const questions = test.questions;
    if (!questions || questions.length === 0) {
      return res.status(404).json({ success: false, message: "No questions found" });
    }

    let correctCount = 0;

    const formattedAnswers = Object.entries(userAnswers).map(([index, selectedOption]) => ({
      questionId: questions[parseInt(index)]?._id,
      selectedOption
    }));

    Object.entries(userAnswers).forEach(([index, answer]) => {
      const i = parseInt(index);
      if (questions[i] && questions[i].correctAnswer === answer) {
        correctCount++;
      }
    });

    const score = correctCount;
    const percentage = (score / questions.length) * 100;
    const isPassed = percentage >= 75;

    let testProgress = await TestProgress.findOne({
      userId,
      courseId,
      moduleId,
      testId,
    });

    if (!testProgress) {
      testProgress = new TestProgress({
        userId,
        courseId,
        moduleId,
        testId,
        retakeCount: 0,
      });
    }

    // console.log('test progress before updating info: ', testProgress)

    testProgress.status = isPassed ? 'completed' : 'failed';
    testProgress.lastAttemptedTime = new Date();
    testProgress.score = score;
    testProgress.isPassed = isPassed;
    testProgress.retakeCount += 1;
    testProgress.yourAnswers = formattedAnswers;

    await testProgress.save();

    // console.log('test progress after saving is:  ', testProgress)

    let moduleProgress = await ModuleProgress.findOne({
      userId,
      courseId,
      moduleId,
    });

    // console.log('module progress initially is: '. moduleProgress)

    if (isPassed && moduleProgress) {  // so we are checking by finding the tesprogress again 
      const alreadyCompleted = await TestProgress.findOne({
        userId,
        courseId,
        moduleId,
        testId,
        isPassed: true,
      });

      if (alreadyCompleted && moduleProgress.completedTest < moduleProgress.totalTests) {
        moduleProgress.completedTest += 1;

        // console.log('module progress total videos are:',  moduleProgress.totalVideos)
        // console.log('module progress total tests are:',  moduleProgress.totalTests)
        // console.log('== == == == ==')
        // console.log('module progress completed videos are:',  moduleProgress.completedVideos)
        // console.log('module progress completed tests are:',  moduleProgress.completedTest)


        const total = moduleProgress.totalVideos + moduleProgress.totalTests;
        const completed = moduleProgress.completedVideos + moduleProgress.completedTest;
        moduleProgress.percentageCompleted = total > 0 ? (completed / total) * 100 : 0;
        await moduleProgress.save();
      }

      // ✅ Check if entire module is completed
      const isModuleCompleted = (
        moduleProgress.totalVideos === moduleProgress.completedVideos &&
        moduleProgress.totalTests === moduleProgress.completedTest
      );

      // console.log('is module completed: ', isModuleCompleted)

      if (isModuleCompleted) {
        moduleProgress.status = 'completed'
        await moduleProgress.save();
      }

      if (isModuleCompleted) {
        const courseProgress = await CourseProgress.findOne({
          userId,
          courseId,
        });

        if (courseProgress && courseProgress.completedModules < courseProgress.totalModules) {
          courseProgress.completedModules += 1;

          courseProgress.overallPercentage =
            courseProgress.totalModules > 0
              ? (courseProgress.completedModules / courseProgress.totalModules) * 100
              : 0;

          if (courseProgress.completedModules === courseProgress.totalModules) {
            courseProgress.isCourseCompleted = true;
            courseProgress.status = 'completed';
            courseProgress.completionDate = new Date();
          }

          await courseProgress.save();
        }
      }
    }

    const allTestProgress = await TestProgress.find({ userId, courseId, moduleId });
    const courseProgress = await CourseProgress.findOne({ userId, courseId });
    const moduleProgressList = await ModuleProgress.find({ userId, courseId });
    const videoProgressList = await VideoProgress.find({ userId, courseId, moduleId });

    return res.status(200).json({
      success: true,
      message: "Test submitted successfully",
      score,
      testProgress,
      courseProgress,
      moduleProgress,
      moduleProgressList: moduleProgressList,
      testProgressList: allTestProgress,
      videoProgressList: videoProgressList,
    });

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
  // console.log("update video completion api called")
  try {
    const videoProgress = await VideoProgress.findOne({ userId, courseId, moduleId, videoId });

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "ModuleId is missing"
      });
    }
    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: "CourseId is missing"
      });
    }
    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: " videoId is missing"
      });
    }


    if (!videoProgress) {
      return res.status(404).json({ success: false, message: 'Video progress not found' });
    }

    const wasCompleted = videoProgress.status === 'completed';
    // console.log('was completed is: ', videoProgress)
    if (!wasCompleted) {
      videoProgress.status = 'completed';
      videoProgress.lastWatchedTime = videoProgress.videoDuration || videoProgress.lastWatchedTime;
      await videoProgress.save();
      // console.log('checking status after saving', videoProgress.status)
    

      const moduleProgress = await ModuleProgress.findOne({ userId, courseId, moduleId });

         if (!moduleProgress) {
      return res.status(404).json({
        success: false,
        message: "Module Progress not found for this user and module"
      });
    }

    // console.log('the module Progress in update vid 90% is: ', moduleProgress)

      if (moduleProgress) {
        moduleProgress.completedVideos += 1;

        const totalItems = moduleProgress.totalVideos + moduleProgress.totalTests;
        const completedItems = moduleProgress.completedVideos + moduleProgress.completedTest;
        moduleProgress.percentageCompleted = totalItems === 0 ? 0 : (completedItems / totalItems) * 100;

        if (moduleProgress.completedVideos >= moduleProgress.totalVideos && moduleProgress.completedTest >= moduleProgress.totalTests) {
          moduleProgress.status = 'completed';
        } else {
          moduleProgress.status = 'in-progress';
        }

        await moduleProgress.save();
      }
    }

    const updatedVideoProgress = await VideoProgress.find({ userId, courseId, moduleId });
    const updatedModuleProgress = await ModuleProgress.find({ userId, courseId });
    const newTestProgress = await TestProgress.find({ userId, courseId, moduleId });
    const courseProgress = await CourseProgress.findOne({ userId, courseId });
    const oneVideoProgress = await VideoProgress.find({ _id: videoProgress._id });
    const oneModuleProgress = await ModuleProgress.findOne({ userId, courseId, moduleId })
    return res.status(200).json({
      success: true,
      message: 'Video marked as completed',
      videoProgress: updatedVideoProgress,
      videoProgressItem: oneVideoProgress[0],
      moduleProgress: updatedModuleProgress,
      testProgress: newTestProgress,
      courseProgress,
      oneModuleProgress
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

const deleteCourse = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id.toString();
  // console.log("user id id : ", userId);
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: "Invalid course ID." });
  }
  try {
    const course = await Course.findById(courseId).populate('modules');
    // console.log("course istructor is : ", course.instructor)
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found." });
    }
    const instructorId = course.instructor.toString();
    if (instructorId !== userId) {
      
      return res.status(403).json({ success: false, message: "You are not authorized to delete this course." });
    }

    for (const modules of course.modules) {
      const module = await Module.findById(modules._id).populate(['videos', 'tests']);
      if (module) {
        for (const video of module.videos) {
          await deleteFromAzureBlob(video.videoBlobName);
          await Video.findByIdAndDelete(video._id);
        }
        for (const test of module.tests) {
          await deleteFromAzureBlob(test.testBlobName);
          await Test.findByIdAndDelete(test._id);
        }
      }
      await Module.findByIdAndDelete(module._id);
    }
    await deleteFromAzureBlob(course.thumbnailBlobName);
    await User.updateMany(
      { courses: courseId },
      { $pull: { courses: courseId } }
    );
    await Course.findByIdAndDelete(courseId);
    await Progress.deleteMany({ course: courseId });

    res.status(200).json({ success: true, message: "Course deleted successfully." });
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

// const generateSASToken = expressAsyncHandler(async (req, res) => {
//   const blobName = req.params.blobName;

//   console.log("Generating SAS token for blob:", blobName);
//   const hours = parseInt(req.query.hours) || 1;
//   const expiresInMinutes = hours * 60;

//   try {
//     const sasToken = await generateSasUrl({ blobName, expiresInMinutes });
//     res.status(200).json({ success: true, sasToken });
//   } catch (error) {
//     console.error('Error generating SAS token:', error);
//     res.status(500).json({ success: false, message: 'Error generating SAS token' });
//   }
// });

const generateSASToken = expressAsyncHandler(async (req, res) => {
    const blobName = req.query.blobName; // get from query
    if (!blobName) return res.status(400).json({ success: false, message: 'blobName is required' });

    // console.log("Generating SAS token for blob:", blobName);

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


const updateLastWatched = expressAsyncHandler(async (req, res) => {
  const { courseId, moduleId, currentTime, currentVideoIndex, videoId } = req.body;



  const userId = req.user._id;

  // console.log('user id is:', userId);
  // console.log('course id is:', courseId);
  // console.log('module id is:', moduleId);
  // console.log('video id is:', videoId);
  // console.log('lastWatched is:', currentTime);
  // console.log('lastVideoIndex is:', currentVideoIndex);

  if (!courseId || !moduleId || currentTime === undefined || currentVideoIndex === undefined || !videoId) {
    return res.status(400).json({
      success: false,
      message: "ModuleId, CourseId, currentTime, videoIndex, or videoId is missing"
    });
  }

  try {
    const videoProgress = await VideoProgress.findOne({ userId, courseId, moduleId, videoId });
    if (!videoProgress) {
      return res.status(404).json({
        success: false,
        message: "videoProgress not found for this user and video"
      });
    }

    const moduleProgress = await ModuleProgress.findOne({ userId, courseId, moduleId });
    if (!moduleProgress) {
      return res.status(404).json({
        success: false,
        message: "Module Progress not found for this user and video"
      });
    }

    // console.log('module progrss before update: ', moduleProgress)

    videoProgress.lastWatchedTime = currentTime;
    await videoProgress.save();

    moduleProgress.videoIndex = currentVideoIndex;
    await moduleProgress.save();

    // console.log('module progrss after update: ', moduleProgress)


    const videoProgressList = await VideoProgress.find({ userId, courseId, moduleId });

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      videoProgress,
      moduleProgress,
      videoProgressList
    });

  } catch (error) {
    console.error('Backend error:', error);
    return res.status(500).json({
      success: false,
      message: "Error in updating last watch video timer"
    });
  }
});

const getAllAssessments = async (req, res) => {
  try {
    const userId = req.user._id; // assuming user is available from auth middleware

    // get all assessments
    const allAssessments = await Assessment.find()
      .select('_id title description testType numberOfQuestions isMandatory topics duration');

    // get all progresses for this user
    const userProgress = await AssessmentProgress.find({ user: userId }).select("assessment");

    // create a set of assessmentIds that user has attempted
    const attemptedSet = new Set(userProgress.map(p => p.assessment.toString()));

    // add attempted flag to each assessment
    const assessmentsWithAttempt = allAssessments.map(a => {
      return {
        ...a.toObject(),
        attempted: attemptedSet.has(a._id.toString())
      };
    });

    res.status(200).json({
      success: true,
      data: assessmentsWithAttempt
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch the assessments',
      error: err.message
    });
  }
};

const getAttemptedAssessment = async (req, res) => {
  try {
    const userId = req.user._id; // assuming user is available from auth middleware
    const { assessmentId } = req.body;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required"
      });
    }

    const userProgress = await AssessmentProgress.findOne({
      user: userId,
      assessment: assessmentId
    });


    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: 'could not find attempted assessment'
      })
    }

    res.status(200).json({
      success: true,
      data: userProgress
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch the assessments',
      error: err.message
    });
  }
};

const startAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const userId = req.user._id;

    // 1. Fetch assessment and populate coding questions
    const assessment = await Assessment.findById(assessmentId)
      .populate('codingQuestionIds')
      .lean();

    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    const title = assessment.title

    // 2. Prepare MCQ questions (strip out correct answers)
    const mcqQuestions = assessment.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      type: 'mcq',
      options: q.options
    }));

    // 3. Prepare Coding Questions (send safe fields only)
    const codingQuestions = assessment.codingQuestionIds.map(cq => ({
      _id: cq._id,
      title: cq.title,
      description: cq.description,
      type: 'coding',
      difficulty: cq.difficulty,
      constraints: cq.constraints,
      sample_code: cq.sample_code,
      language_id: cq.language_id,
      run_code_testcases: cq.run_code_testcases, // only show sample/public test cases
      // ❌ do NOT include submit_code_testcases (hidden test cases for grading)
      yourCodingAnswer: "",
      total_test_cases: null,
      total_test_cases_passed: null,
      isCorrect: false,
    }));

    const questions = [...mcqQuestions, ...codingQuestions];

    // 4. Check if AssessmentProgress already exists
    let progress = await AssessmentProgress.findOne({
      user: userId,
      assessment: assessmentId
    });

    if (progress) {
      return res.status(200).json({
        success: true,
        message: "Assessment already started",
        data: progress
      });
    }

    // 5. If not, create new AssessmentProgress

    const startedAt = new Date();
    const completeTestByDateAndTime = new Date(startedAt.getTime() + assessment.duration * 60000); // duration in mins → ms
    progress = new AssessmentProgress({
      user: userId,
      title: title,
      duration: assessment.duration,
      assessment: assessmentId,
      questions: questions,
      status: 'in-progress',
      startedAt: new Date(),
      completeTestByDateAndTime
    });

    await progress.save();

    return res.status(201).json({
      success: true,
      message: "Assessment started successfully",
      data: progress
    });

  } catch (error) {
    console.error("Error in starting assessment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start the test"
    });
  }
};

const submitAssessment = async (req, res) => {
  try {
    const { assessmentId, allAnswers } = req.body;
    const userId = req.user._id;

    let progress = await AssessmentProgress.findOne({
      user: userId,
      _id: assessmentId
    });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Progress not found for this assessment"
      });
    }

    // keep existing coding questions saved in progress
    const codingQuestions = progress.questions.filter(q => q.type === 'coding');

    const progressAssessmentId = progress.assessment;
    const assessment = await Assessment.findById(progressAssessmentId).lean();
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    // Build answer map for quick lookup (store ids as strings)
    const answersMap = {};
    (allAnswers || []).forEach(ans => {
      // ans.question_id and ans.option_id expected
      if (ans && ans.question_id) answersMap[ans.question_id.toString()] = (ans.option_id || "").toString();
    });

    // MCQ counters
    let correctCount = 0;
    let totalMcqQuestions = (assessment.questions || []).length;
    let totalAnsweredMcqQuestions = 0;
    let totalUnansweredMcqQuestions = 0;
    let totalIncorrectMcqQuestions = 0;

    // Build updated MCQ question entries
    const updatedMcqQuestions = (assessment.questions || []).map(q => {
      const qIdStr = q._id.toString();
      const userOptionId = answersMap[qIdStr]; // may be undefined or ""
      // find option only if id present
      const userOption = userOptionId ? q.options.find(opt => opt._id.toString() === userOptionId) : undefined;
      const userAnswerText = userOption ? (userOption.optionText ?? null) : null;

      // Determine unanswered: no option selected or selected option has empty/null text
      if (!userOption || userAnswerText === null || userAnswerText === "") {
        totalUnansweredMcqQuestions++;
      } else {
        totalAnsweredMcqQuestions++;
      }

      // Determine correctness
      const isCorrect = (userAnswerText !== null && userAnswerText !== "") && (userAnswerText === q.correctAnswer);
      if (isCorrect) {
        correctCount++;
      } else {
        // If user actually answered but it's not correct -> incorrect
        if (userOption && (userAnswerText !== null && userAnswerText !== "")) {
          totalIncorrectMcqQuestions++;
        }
      }

      return {
        questionId: q._id,
        type: 'mcq',
        questionText: q.questionText,
        yourAnswer: userAnswerText,           // null if not answered
        correctAnswer: q.correctAnswer,
        isCorrect
      };
    });

    // Combine updated mcq questions with previously stored coding questions (retain progress)
    const updatedQuestionsWithCodingAndMcqAnswer = [
      ...updatedMcqQuestions,
      ...codingQuestions
    ];

    // MCQ scores
    const mcqMarksPerQ = 4;
    const mcqMarks = correctCount * mcqMarksPerQ;
    const mcqMax = totalMcqQuestions * mcqMarksPerQ;

    // Coding counters and scoring
    let codingMarks = 0;
    const codingCount = codingQuestions.length;
    const codingMarksPerQ = 10;
    const codingMax = codingCount * codingMarksPerQ;

    let totalAnsweredCodingQuestions = 0;
    let totalUnansweredCodingQuestions = 0;
    let totalIncorrectCodingQuestions = 0;

    for (const cq of codingQuestions) {
      // expect cq to contain fields like yourCodingAnswer, total_test_cases, total_test_cases_passed, isCorrect
      const total = Number(cq.total_test_cases) || 0;
      const passed = Number(cq.total_test_cases_passed) || 0;
      const userCode = (cq.yourCodingAnswer === undefined) ? null : cq.yourCodingAnswer;

      if (userCode === null || userCode === "") {
        totalUnansweredCodingQuestions++;
      } else {
        totalAnsweredCodingQuestions++;
      }

      let marksForThis = 0;
      if (total > 0) {
        marksForThis = (passed / total) * codingMarksPerQ; // partial marks between 0..10
      } else {
        // fallback: if total testcases not available, use cq.isCorrect boolean if present
        marksForThis = cq.isCorrect ? codingMarksPerQ : 0;
      }

      // If answered but not full marks, count as incorrect (adjust policy if you want different definition)
      if ((userCode !== null && userCode !== "") && Number(marksForThis) < codingMarksPerQ) {
        totalIncorrectCodingQuestions++;
      }

      codingMarks += Number(marksForThis);
    }

    // Round coding marks to 2 decimals
    codingMarks = Number(codingMarks.toFixed(2));

    // Totals & combined score
    const totalMarks = mcqMarks + codingMarks;
    const maxMarks = mcqMax + codingMax;
    const score = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
    const isPassed = score >= 75; // pass threshold

    const totalQuestions = totalMcqQuestions + codingCount;

    // Persist into progress object fields expected by schema
    progress.questions = updatedQuestionsWithCodingAndMcqAnswer;
    progress.MarksScore = score;
    progress.isPassed = isPassed;
    progress.TotalMarks = maxMarks;
    progress.status = isPassed ? "passed" : "failed";
    progress.totalQuestions = totalQuestions;

    // MCQ meta
    progress.TotalMcqQuestions = totalMcqQuestions;
    progress.TotalAnsweredMcqQuestions = totalAnsweredMcqQuestions;
    progress.TotalUnansweredMcqQuestions = totalUnansweredMcqQuestions;
    progress.TotalIncorrectMcqQuestions = totalIncorrectMcqQuestions;
    progress.MarksForEachMcqQuestion = mcqMarksPerQ;
    progress.MarksScoredForMcq = mcqMarks;

    // Coding meta
    progress.TotalAnsweredCodingQuestions = totalAnsweredCodingQuestions;
    progress.TotalUnansweredCodingQuestions = totalUnansweredCodingQuestions;
    progress.TotalIncorrectCodingQuestions = totalIncorrectCodingQuestions;
    progress.MarksForEachCodingQuestion = codingMarksPerQ;
    progress.MarksScoredForCoding = codingMarks;

    // Your raw answers (store as before)
    progress.yourAnswers = (allAnswers || []).map(ans => ({
      questionId: ans.question_id,
      selectedOption: ans.option_id
    }));

    progress.lastAttemptedTime = new Date();

    await progress.save();

    return res.status(200).json({
      success: true,
      message: "Assessment submitted successfully",
      data: progress
    });

  } catch (error) {
    console.error("submitAssessment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit the test'
    });
  }
};


const moduleProgressChecker = async (req, res) => {
  try {
    const {  courseId, moduleId } = req.body;
    const userId = req.user._id;

    // console.log('module id is: ', moduleId)
    // console.log('course id is: ', courseId)
    // console.log('user id is: ', userId)


    // 1. Find module progress
    const moduleProgress = await ModuleProgress.findOne({ userId, courseId, moduleId });
    if (!moduleProgress) {
      return res.status(404).json({
        success: false,
        message: "Module Progress not found for this user and module"
      });
    }

    // 2. Get all video progress
    const allVideoProgress = await VideoProgress.find({ userId, courseId, moduleId });

    // 3. Count completed videos
    
    const completedCount = allVideoProgress.filter(v => v.status === "completed").length;

    // 4. Check if mismatch
    if (completedCount !== moduleProgress.completedVideos) {
      const percentage = (completedCount / moduleProgress.totalVideos) * 100;

      // Update the module progress
      moduleProgress.completedVideos = completedCount;
      moduleProgress.percentageCompleted = percentage;
      moduleProgress.status = completedCount === moduleProgress.totalVideos ? "completed" : "in-progress";

      await moduleProgress.save();
    }

    // 5. Return updated module progress
    return res.status(200).json({
      success: true,
      moduleProgress
    });

  } catch (err) {
    console.error("Error in moduleProgressChecker:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


module.exports = {
  createCourse,
  createModule,
  createVideo,
  createArticle,
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
  updateLastWatched,
  getAllAssessments,
  startAssessment,
  submitAssessment,
  getAttemptedAssessment,
  moduleProgressChecker
};