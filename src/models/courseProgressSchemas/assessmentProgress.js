const mongoose = require("mongoose");

const assessmentProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  status: {
    type: String,
    enum: [ 'not-started','in-progress', 'passed', 'failed'],
    default: 'not-started'
  },
  lastAttemptedTime: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  retakeCount: {
    type: Number,
    default: 0
  },
  yourAnswers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedOption: { 
      type: String,
      required: true
    }
  }]
}, { timestamps: true }); 

const AssessmentProgress = mongoose.model('AssessmentProgress', testProgressSchema);
module.exports = AssessmentProgress;


