const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: true
  }
}, { _id: false });

const exampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
}, { _id: false });

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true }
}, { _id: false });

const codingDetailsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  examples: [exampleSchema],
  constraints: [String],
  testCases: [testCaseSchema]
}, { _id: false });

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['mcq', 'coding'],
    required: true
  },
  options: [optionSchema], // only for MCQ
  codingDetails: codingDetailsSchema, // only for coding
  correctAnswer: mongoose.Schema.Types.Mixed // flexible: option text/id for MCQ, array or code for coding
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String, 
    required: true
  },
  testType: {
    type: String,
    enum: ['mcq', 'coding', 'both'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  topics: {
    type: [String],
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  questions: [questionSchema]
}, {
  timestamps: true
});

const Assessment = mongoose.model('Assessment', assessmentSchema);
module.exports = Assessment;
