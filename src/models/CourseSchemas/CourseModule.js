const mongoose = require('mongoose');
const   moduleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
    }],
    articles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    }],
    tests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
    }],
    currentVideoIndex: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'completed'],
        default: 'not-started',
    },
    percentageCompleted: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

const Module = mongoose.model('Module', moduleSchema);
module.exports = Module;