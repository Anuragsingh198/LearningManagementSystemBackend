const {createCourse, createModule, createTest, createVideo , getCourses, getModulesByCourseId, getCourseByCourseId, getVideosByModuleId, getModuleById, getCourseProgress, generateCertificate, deleteCourse, deleteVideo, deleteModule, deleteTest, generateSASToken} = require('../controllers/CourseController');
const express = require('express');
const { protect, isInstructor, isEmployee } = require('../middlewares/authmiddleware');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const  courseRoutes = express.Router();


courseRoutes.post('/course-module', protect, isInstructor, createModule);
courseRoutes.post('/create-course', protect, isInstructor, upload.single('thumbnail'), createCourse);
courseRoutes.post('/create-video', protect, isInstructor, upload.single('video'), createVideo);   
courseRoutes.post('/addtest', protect, isInstructor, createTest);
courseRoutes.get('/', getCourses);
courseRoutes.get('/modules/:courseId' , getModulesByCourseId)
courseRoutes.get('/:courseId' , getCourseByCourseId)
courseRoutes.post('/generate-certificate' ,protect , isEmployee ,generateCertificate)
courseRoutes.delete('/delete-course/:courseId', protect, isInstructor, deleteCourse);
courseRoutes.delete('/delete-video/:videoId', protect, isInstructor, deleteVideo);
courseRoutes.delete('/delete-module/:moduleId', protect, isInstructor, deleteModule);
courseRoutes.delete('/delete-test/:testId', protect, isInstructor, deleteTest);
courseRoutes.get('/videos/:blobName/expires', protect, generateSASToken); 
// courseRoutes.get('/videos/:moduleId' , getVideosByModuleId)
courseRoutes.get('/module/:moduleId' , getModuleById)

module.exports = courseRoutes;