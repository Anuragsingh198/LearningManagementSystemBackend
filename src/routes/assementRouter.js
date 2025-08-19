const { getAllLanguages, getQuestionById, fetchAllCodingQuestions,    runCode, submitCode, addAssessment } = require('../controllers/jugde0Controller');
const express = require('express');
const assementRouter = express.Router();

assementRouter.get('/get-languages', getAllLanguages);  
assementRouter.post('/submit-code', submitCode);
assementRouter.post('/run-code',     runCode);
assementRouter.get('/allQuestions', fetchAllCodingQuestions);    
assementRouter.post('/add-assessment', addAssessment);    
assementRouter.get('/:questionId', getQuestionById);   



module.exports = assementRouter;
