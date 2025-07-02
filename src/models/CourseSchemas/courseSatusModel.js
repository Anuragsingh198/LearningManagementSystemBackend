const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  moduleProgress: [{
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
    videoIndex:{
        type:Number,
        default:0
    },
    percentageCompleted: {
      type: Number,
      default: 0,
    },
    videoProgress: [{
      video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
      },
      status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed'],
        default: 'not-started',
      }
    }],
    testStatus: [{
      test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
      },

      isCompleted: {
        type: Boolean,
        default: false
      },
      retakeCount:{
        type:Number,
        default:0
      },
      marksScored:{
        type:Number,
        default:0
      }
    }]
  }],
  overallPercentage: {
    type: Number,
    default: 0
  },
  status:{
    type:String,
    enum:['not-enrolled','enrolled' , 'pending' , 'completed'],
    default: 'not-enrolled'
  },
  isCourseCompleted: {
    type: Boolean,
    default: false
  },
  remainingDays:{
    type:Number,
    default:0
  },
  enrolledDate: {
  type: Date,
  default: Date.now
},
completionDate: {
  type: Date,
  default: Date.now
}
}, {
  timestamps: true
});
const Progress = mongoose.model('UserProgress', userProgressSchema);
module.exports =  Progress;

