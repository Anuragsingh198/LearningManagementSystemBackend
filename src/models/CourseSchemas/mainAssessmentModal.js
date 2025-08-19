const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: true
  }
});

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'mcq'
  },
  options: [optionSchema], 
  correctAnswer: { type: String, required: true }

});

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
   isMandatory: { type: Boolean, default: false },
  topics: {
    type: [String],
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  questions: [questionSchema],
  codingQuestionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CodingQuestion'
  }],
}, {
  timestamps: true
});

const Assessment = mongoose.model('Assessment', assessmentSchema);
module.exports = Assessment;
