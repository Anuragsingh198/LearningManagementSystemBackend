const mongoose = require('mongoose');

const videoProgressSchema = new mongoose.Schema({
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
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  videoDuration:{type:Number , default:0},
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
lastWatchedTime: {
  type: Number, 
  default: 0   
}
}, { timestamps: true });

const VideoProgress = mongoose.model('VideoProgress', videoProgressSchema);
module.exports = VideoProgress;
