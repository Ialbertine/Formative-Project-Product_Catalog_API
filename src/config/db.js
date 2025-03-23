const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI); // Removed deprecated options
    console.log('MongoDB connected');
  } catch (err) {
    console.log('Database connection error:', err);
    process.exit(1); // Exit the process with failure
  }
};

module.exports = connectDB;