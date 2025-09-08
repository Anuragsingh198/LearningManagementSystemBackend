const mongoose = require("mongoose");

const userAnswerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  selectedOption: {  // for MCQ
    type: String
  },
  submittedCode: {   // for coding
    type: String
  }
}, { _id: false });

const assessmentProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  assessment: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Assessment',
  required: true
},
duration: {
  type: Number,
  required: true
},
  questions: {
    type: [],
    required: true
  },
  totalQuestions: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['not-started','in-progress','passed','failed'],
    default: 'not-started'
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date
  },
  lastAttemptedTime: {
    type: Date,
    default: Date.now
  },
  completeTestByDateAndTime:{
    type: Date,
    required: true
  },
  PercentageMarksScore: {
    type: Number,
    default: 0,
    min: 0
  },
   MaxMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  TotalMarksScored: {
    type: Number,
    default: 0,
    min: 0
  },
  TotalMcqQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
  TotalAnsweredMcqQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
    TotalAnsweredAndCorrectMcqQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
    TotalUnansweredMcqQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
     TotalIncorrectMcqQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
  MarksForEachMcqQuestion: {
    type: Number,
    default: 4,
  },
  MarksScoredForMcq: {
    type: Number,
    default: 0,
    min: 0
  },
    TotalAnsweredCodingQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
  TotalAnsweredAndCorrectCodingQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
    TotalUnansweredCodingQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
     TotalIncorrectCodingQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
   MarksForEachCodingQuestion: {
    type: Number,
    default: 10,
  },
    MarksScoredForCoding: {
    type: Number,
    default: 0,
    min: 0
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  retakeCount: {
    type: Number,
    default: 0
  },
  yourAnswers: [userAnswerSchema]
}, { timestamps: true });

const AssessmentProgress = mongoose.model('AssessmentProgress', assessmentProgressSchema);
module.exports = AssessmentProgress;
