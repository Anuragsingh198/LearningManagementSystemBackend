const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan('dev')); 
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);

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
