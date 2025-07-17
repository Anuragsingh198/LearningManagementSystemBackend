const mongoose = require('mongoose');

const courseProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User ID is required"]
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, "Course ID is required"]
  },
  courseInstructor:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:[true, "instructor Id is needed"],
  },
  overallPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Progress cannot be less than 0%'],
    max: [100, 'Progress cannot be more than 100%'],
  },
  status: {
    type: String,
    enum: ['not-enrolled', 'enrolled', 'pending', 'completed'],
    default: 'not-enrolled'
  },
  isCourseCompleted: {
    type: Boolean,
    default: false
  },
  remainingDays: {
    type: Number,
    default: 0
  },
  enrolledDate: {
    type: Date,
    default: Date.now
  },
//   totalTests:{type:Number , default:0},
//   totalVideos:{type:Number , default:0},
  totalModules:{type:Number , default:0},
  completedModules:{type:Number , default:0},
  completionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true 
});

const CourseProgress = mongoose.model('CourseProgress', courseProgressSchema);
module.exports = CourseProgress;
