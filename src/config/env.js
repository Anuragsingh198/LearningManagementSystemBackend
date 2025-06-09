require('dotenv').config();

const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URL: process.env.MONGO_URI || 'mongodb://localhost:27017/lms',
  JWT_SECRET: process.env.JWT_SECRET
}

module.exports = config;
