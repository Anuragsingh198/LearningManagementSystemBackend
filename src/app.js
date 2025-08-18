const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const assementRouter = require('./routes/assementRouter');
const seedQuestions = require('./utils/seed');


const app = express();
connectDB();

// seedQuestions();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
];


app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev')); 
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assements' ,assementRouter )
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
