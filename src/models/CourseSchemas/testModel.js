const mongoose = require('mongoose');
const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
  },
  user:{
        type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
isCompleted:{
    type:Boolean,
    default: false
},
  questions: [
    {
      questionText: {
        type: String,
        required: true,
      },
      options: [
        {
          optionText: {
            type: String,
            required: true,
          },
        }
      ],
      correctAnswer:{
        type:String, 
      }
    }
  ],
}, {
  timestamps: true,
});

const Test = mongoose.model('Test', testSchema);
module.exports = Test;
