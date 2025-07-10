const mongoose  =   require('mongoose');

const connectDB = async () => {
    try {
        console.log('the url c is ', process.env.MONGO_URL);
        await mongoose.connect(process.env.MONGO_URL,{
  ssl: true,
});
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); 
    }
    }

module.exports = connectDB;