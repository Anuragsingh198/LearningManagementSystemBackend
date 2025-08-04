const mongoose = require("mongoose");

const testProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  status: {
    type: String,
    enum: [ 'in-progress', 'completed', 'failed'],
    default: 'in-progress'
  },
  lastAttemptedTime: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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

const TestProgress = mongoose.model('TestProgress', testProgressSchema);
module.exports = TestProgress;


