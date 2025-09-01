const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const sendEmail = require('../utils/sendemail');
const expressAsyncHandler = require('express-async-handler');
const Otp = require('../models/otp');
const Progress = require('../models/CourseSchemas/courseSatusModel');
const Course = require('../models/CourseSchemas/courseModel');
const { otpTemplate } = require('../utils/emailhtmls');
const bcrypt = require('bcrypt');
const e = require('express');
const CourseProgress = require('../models/courseProgressSchemas/courseProgress');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};


const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, userType: role, employeeId } = req.body;
  //console.log('Registering user:', { name, email, role });
  if (!email.endsWith('@ielektron.com')) {
    return res.status(403).json({
      success: false,
      message: 'This email ID is not allowed. Please use your organization email ID.'
    });
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }
const  lowerEmail = email.toLowerCase();
  const user = await User.create({
    name,
    email:lowerEmail,
    password,
    role,
    employeeId
  });
  if (user) {
    res.status(201).json({
      success: true, user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        courses: user.courses,
        employeeId: user.employeeId,
        token: generateToken(user._id),
      }
    });
    //console.log('User registered successfully:', user);
  } else {
    res.status(400).json({ success: false, message: 'Invalid user data' });
  }
}
);

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email.endsWith('@ielektron.com')) {
    return res.status(403).json({
      success: false,
      message: 'This email ID is not allowed. Please use your organization email ID.'
    });
  }
 const  lowerEmail = email.toLowerCase();
  const user = await User.findOne({ email: lowerEmail });
  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true, user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        courses: user.courses,
        employeeId: user.employeeId || " ",
        token: generateToken(user._id),
      }
    });
    // sendEmail('anuragsingh.bisen@ielektron.com' , ' hi this is test email')
  } else {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
});


const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateOtpHandler = expressAsyncHandler(async (req, res) => {
  const { email , type } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }
  
  //console.log("email is sjakbvsjkdv", email)
  if (!email.endsWith('@ielektron.com')) {
    //console.log("endsWith wjnanvadn")
    return res.status(403).json({
      success: false,
      message: 'This email ID is not allowed. Please use your organization email ID.'
    });
  }
  const newEmail = email.toLowerCase();
  if(type === 'signup'){
    const userExists = await User.findOne({ email: newEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
  }

  try {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
    const html = otpTemplate(name, otp);

    await sendEmail(email, html);

    res.status(200).json({ success: true, message: "OTP sent to email." });
  } catch (error) {
    //console.error("OTP Generation Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate and send OTP." });
  }
});

const verifyOtpHandler = expressAsyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Email and OTP are required." });
  }

  try {
    const record = await Otp.findOne({ email });

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found." });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    if (new Date() > record.expiresAt) {
      await Otp.deleteOne({ email });
      return res.status(400).json({ success: false, message: "OTP expired." });
    }

    await Otp.deleteOne({ email });
    res.status(200).json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    //console.error("OTP Verification Error:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
});


const getEnrolledEmployees = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  try {
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const course = await Course.findById(courseId).populate('students');
    
    if (!course || course.students.length === 0) {
      return res.status(404).json({ success: false, message: "No students found in this course" });
    }

    const showAllStudentData = [];
    const studentCount = course.students.length;
    const title = course.title;

    for (const student of course.students) {
      const progressRecords = await CourseProgress.find({
        userId: student._id,
        courseId: course._id,
      }).populate("userId");

      //console.log('courseis: ', course);
      //console.log('progress record is: ', progressRecords);

      if (progressRecords.length > 0) {
        progressRecords.forEach((record) => {
          if (record.userId) {
            showAllStudentData.push({
              status: record.status,
              name: record.userId.name,
              empId: record.userId.employeeId || "EMP001",
            });
          }
        });
      }
    }

    //console.log('students are is: ', showAllStudentData);

    return res.status(200).json({
      success: true,
      enrollStudents: {
        title,
        studentCount,
        students: showAllStudentData,
      },
    });

  } catch (error) {
    //console.error("Error fetching enrolled employees:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

const resetPassword = expressAsyncHandler(async (req, res) => {
  //console.log('req. body is for reset password:', req.password);

  const { email, password } = req.body;
  //console.log('resetting password:', { email, password });

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.password = password;
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    //console.error("Error resetting password:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});





module.exports = {
  registerUser,
  loginUser,
  generateOtpHandler,
  getEnrolledEmployees,
  verifyOtpHandler,
  resetPassword
};