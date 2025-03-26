const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};

// Create an admin user (for initial setup)
const createAdminUser = async () => {
  try {
    console.log('Checking if admin exists...');
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (adminExists) {
      console.log('Admin already exists:', adminExists);
      return;
    }

    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    const adminUser = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      // ... (other fields)
    });

    console.log('Admin created successfully:', adminUser);
  } catch (error) {
    console.error('❌ Admin creation failed:', error);
    throw error; // Ensure the error propagates
  }
};

const initializeAdmin = async () => {
  try {
    await createAdminUser();
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};


module.exports = {
  getAllUsers,
  deleteUser,
  createAdminUser,
  initializeAdmin,
};