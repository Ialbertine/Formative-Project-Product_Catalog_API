const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');
const { 
  getAllUsers, 
  deleteUser 
} = require('../controllers/adminController');
const { 
  getAllCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');

// User routes
router.get('/users', isAuth, isAdmin, getAllUsers);
router.delete('/users/:id', isAuth, isAdmin, deleteUser);

// Category routes
router.get('/api/category', isAuth, isAdmin, getAllCategories);
router.get('/api/category/:id', isAuth, isAdmin, getCategoryById);
router.post('/api/category', isAuth, isAdmin, createCategory);
router.put('/api/category/:id', isAuth, isAdmin, updateCategory);
router.delete('/api/category/:id', isAuth, isAdmin, deleteCategory);

// Product routes
router.get('/api/product', isAuth, isAdmin, getAllProducts);
router.get('/api/product/:id', isAuth, isAdmin, getProductById);
router.post('/api/product', isAuth, isAdmin, createProduct);
router.put('/api/product/:id', isAuth, isAdmin, updateProduct);
router.delete('/api/product/:id', isAuth, isAdmin, deleteProduct);

module.exports = router;