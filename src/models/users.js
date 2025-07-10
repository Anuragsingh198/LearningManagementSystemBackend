const   mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoServerClosedError } = require('mongodb');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    employeeId:{
        type:String,
        required:true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type:String,
        enum : ['instructor', 'employee'],
        default: 'employee',
    },
    courses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
}, {
    timestamps: true,
});
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}
const User = mongoose.model('User', userSchema);
module.exports = User;