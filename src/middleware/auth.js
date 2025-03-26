const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token expiration times
const ACCESS_TOKEN_EXPIRE = process.env.JWT_EXPIRE || '15m';
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d';

const isAuth = async (req, res, next) => {
  try {
    let accessToken;
    let refreshToken;
    
    // Check for tokens in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      accessToken = req.headers.authorization.split(' ')[1];
    }
    
    if (req.headers['x-refresh-token']) {
      refreshToken = req.headers['x-refresh-token'];
    }
    
    if (!accessToken) {
      return res.status(401).json({ 
        message: 'No access token, authorization denied',
        reason: 'TOKEN_MISSING' 
      });
    }
    
    let decoded;
    try {
      // Verify access token
      decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    } catch (accessTokenError) {
      if (accessTokenError.name === 'TokenExpiredError' && refreshToken) {
        try {
          const refreshDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
          const user = await User.findById(refreshDecoded.id).select('-password');
          
          if (!user) {
            return res.status(401).json({ 
              message: 'User not found',
              reason: 'USER_NOT_FOUND' 
            });
          }
          
          // Enhanced account status check
          if (!user.isActive) {
            console.error(`Inactive account token refresh attempt: ${user.email}`);
            return res.status(401).json({ 
              message: 'Account is inactive',
              reason: 'ACCOUNT_INACTIVE' 
            });
          }
          
          // Generate new tokens
          const newAccessToken = generateAccessToken(user);
          const newRefreshToken = generateRefreshToken(user);
          
          // Update last login
          await User.findByIdAndUpdate(user._id, { lastLogin: Date.now() });
          
          // Explicitly send new tokens in the response
          return res.status(200).json({
            message: 'Token refreshed successfully',
            user: {
              id: user._id,
              role: user.role
            },
            tokens: {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken
            }
          });
        } catch (refreshError) {
          console.error('Refresh token error:', refreshError);
          return res.status(401).json({ 
            message: 'Session expired. Please login again.',
            reason: 'SESSION_EXPIRED' 
          });
        }
      }
      
      console.error('Access token error:', accessTokenError);
      return res.status(401).json({ 
        message: 'Invalid access token',
        reason: 'INVALID_TOKEN' 
      });
    }
    
    // Access token is valid
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        reason: 'USER_NOT_FOUND' 
      });
    }
    
    // Enhanced account status check with detailed logging
    if (!user.isActive) {
      console.error(`Inactive account access attempt: ${user.email}`);
      return res.status(401).json({ 
        message: 'Account is inactive',
        reason: 'ACCOUNT_INACTIVE' 
      });
    }
    
    // Attach user to request
    req.user = user;
    
    // Update last login
    User.findByIdAndUpdate(user._id, { lastLogin: Date.now() }).catch(err => 
      console.error('Error updating last login:', err)
    );
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      message: 'Authentication failed',
      reason: 'GENERAL_AUTH_ERROR' 
    });
  }
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Admin access required',
      reason: 'and you are not admin' 
    });
  }
};

// Role-based access control
const hasRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ 
        message: `Role '${role}' required`,
        reason: 'INSUFFICIENT_PERMISSIONS' 
      });
    }
  };
};

// Token generation helpers
function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRE }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRE }
  );
}

module.exports = { 
  isAuth, 
  isAdmin, 
  hasRole,
  generateAccessToken,
  generateRefreshToken
};