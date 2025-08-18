const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    url: {
        type: String, //not mandatory since we can have text instead of pdf as well
    },
    articleBlobName: {
        type: String, 
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
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
    status: {
                type: String,
                enum: ['not-started', 'in-progress', 'completed'],
                default: 'not-started',
            },
}, {
    timestamps: true,
});
const Article = mongoose.model('Article', articleSchema);
module.exports = Article;