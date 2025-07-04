const  mongoose = require('mongoose');

const  videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    videoBlobName:{
        type:String,
        required:true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    duration: {
        type: Number, 
        required: true,
    },
      status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed'],
        default: 'not-started',
    },
}, {
    timestamps: true,
});
const Video = mongoose.model('Video', videoSchema);
module.exports = Video;