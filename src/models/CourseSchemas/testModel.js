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
          isCorrect: {
            type: Boolean,
            default: false,
          },
        }
      ],
    }
  ],
}, {
  timestamps: true,
});


const Test = mongoose.model('Test', testSchema);
module.exports = Test;
