const mongoose = require('mongoose');


const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructorName: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    category: { type: String, required: true }, 
    thumbnail: { type: String, required: true },
    modules: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Module' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    percentageCompleted: { type: Number, default: 0 },
    certificate: { type: String, default: '' },
    compulsory: { type: Boolean, default: 'false' },
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
