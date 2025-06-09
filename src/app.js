const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cloudinary =  require('cloudinary').v2
const fs =  require('fs')
dotenv.config();



cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
})


const connectDB = require('./config/db');
// const authRoutes = require('./routes/auth.routes');
// const teacherRoutes = require('./routes/teacher.routes');
// const studentRoutes = require('./routes/student.routes');
// const courseRoutes = require('./routes/course.routes');
// const videoRoutes = require('./routes/video.routes');
// const quizRoutes = require('./routes/quiz.routes');
// const testRoutes = require('./routes/test.routes');

const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); //  this will log HTTP requests to the console  and  // can be useful for debugging

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/teacher', teacherRoutes);
// app.use('/api/student', studentRoutes);
// app.use('/api/courses', courseRoutes);
// app.use('/api/videos', videoRoutes);
// app.use('/api/quiz', quizRoutes);
// app.use('/api/test', testRoutes);

// Health check

// Global fallback route or health check
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
// app.use('/teacher', courseRoutes);
app.use((req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server started correctly',
  });
});

app.get('/', (req, res) => {
  res.send('LMS API is running...');
});

module.exports = app;
