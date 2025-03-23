const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile
} = require('../controllers/userController');
const { isAuth } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', isAuth, getCurrentUser);
router.put('/me', isAuth, updateProfile);

module.exports = router;