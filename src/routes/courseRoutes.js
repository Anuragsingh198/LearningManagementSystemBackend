const {createCourse, createModule, createTest, createVideo , getCourses, getModulesByCourseId, getCourseByCourseId, getVideosByModuleId, getModuleById} = require('../controllers/CourseController');
const express = require('express');
const { protect, isInstructor } = require('../middlewares/authmiddleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const  courseRoutes = express.Router();


courseRoutes.post('/course-module', protect, isInstructor, createModule);
courseRoutes.post('/create-course', protect, isInstructor, upload.single('thumbnail'), createCourse);
courseRoutes.post('/create-video', protect, isInstructor, upload.single('video'), createVideo);   
courseRoutes.post('/addtest', protect, isInstructor, createTest);
courseRoutes.get('/', protect, getCourses);
courseRoutes.get('/modules/:courseId' , getModulesByCourseId)
courseRoutes.get('/:courseId' , getCourseByCourseId)
// courseRoutes.get('/videos/:moduleId' , getVideosByModuleId)
courseRoutes.get('/module/:moduleId' , getModuleById)

module.exports = courseRoutes;