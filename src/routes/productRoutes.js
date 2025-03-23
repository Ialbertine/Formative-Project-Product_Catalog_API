const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { validateProduct } = require('../middleware/validators');
const { uploadProductImage } = require('../middleware/fileUpload');

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Get products by category
router.get('/category/:categoryId', productController.getProductsByCategory);

// Create a new product
router.post('/',
  uploadProductImage,
  validateProduct,
  productController.createProduct
);

// Update a product
router.put('/:id',
  uploadProductImage,
  validateProduct,
  productController.updateProduct
);

// Delete a product
router.delete('/:id', productController.deleteProduct);

module.exports = router;