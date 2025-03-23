const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAuth = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'You are not authorized. There is no token' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id and exclude password
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    // Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({ message: 'Account is inactive. Please contact support.' });
    }
    
    // Update last login time
    User.findByIdAndUpdate(req.user._id, { lastLogin: Date.now() }).catch(err => 
      console.error('Error updating last login time:', err)
    );
    
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

// Middleware to check user role
const hasRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: `Not authorized. Role '${role}' required.` });
    }
  };
};

module.exports = { isAuth, isAdmin, hasRole };