const { getAllLanguages, getQuestionById,     runCode, submitCode } = require('../controllers/jugde0Controller');
const express = require('express');
const assementRouter = express.Router();

assementRouter.get('/get-languages', getAllLanguages);  
assementRouter.post('/submit-code', submitCode);
assementRouter.post('/run-code',     runCode);
assementRouter.get('/:questionId', getQuestionById);    

module.exports = assementRouter;
