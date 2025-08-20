const { getAllLanguages, getQuestionById, fetchAllCodingQuestions,    runCode, submitCode, addAssessment } = require('../controllers/jugde0Controller');
const express = require('express');
const { protect, isInstructor } = require('../middlewares/authmiddleware');
const { getAllAssessments, startAssessment } = require('../controllers/CourseController');
const assementRouter = express.Router();

assementRouter.get('/get-languages', getAllLanguages);  
assementRouter.post('/submit-code', submitCode);
assementRouter.post('/run-code',     runCode);
assementRouter.get('/allQuestions', protect, isInstructor, fetchAllCodingQuestions);    
assementRouter.post('/add-assessment', protect,  addAssessment);    
assementRouter.get('/get-all-assessments', getAllAssessments);    
assementRouter.post('/start-assessment', protect, startAssessment);    

assementRouter.get('/:questionId', getQuestionById);   



module.exports = assementRouter;
