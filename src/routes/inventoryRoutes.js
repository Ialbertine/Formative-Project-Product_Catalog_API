const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuth, isAdmin } = require('../middleware/auth');

// @desc    Update product inventory
// @route   PUT /api/inventory/:id
// @access  Private/Admin
router.put('/:id', isAuth, isAdmin, async (req, res) => {
  try {
    const { stock, location, status, variants } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update main stock if provided
    if (stock !== undefined) {
      product.stock = stock;
    }
    
    // Update inventory location if provided
    if (location) {
      // Add location field if it doesn't exist yet
      if (!product.inventoryLocation) {
        product.inventoryLocation = location;
      } else {
        product.inventoryLocation = location;
      }
    }
    
    // Update inventory status if provided
    if (status) {
      // Add status field if it doesn't exist yet
      if (!product.inventoryStatus) {
        product.inventoryStatus = status;
      } else {
        product.inventoryStatus = status;
      }
    }
    
    // Update variants if provided
    if (variants && Array.isArray(variants)) {
      // For each variant in the request
      variants.forEach(updatedVariant => {
        // Find matching variant in product
        const existingVariantIndex = product.variants.findIndex(
          v => v.size === updatedVariant.size && v.color === updatedVariant.color
        );
        
        if (existingVariantIndex >= 0) {
          // Update existing variant stock
          product.variants[existingVariantIndex].stock = updatedVariant.stock;
        } else {
          // Add new variant
          product.variants.push(updatedVariant);
        }
      });
    }
    
    const updatedProduct = await product.save();
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private/Admin
router.get('/', isAuth, isAdmin, async (req, res) => {
  try {
    const inventory = await Product.find({})
      .select('name stock variants inventoryLocation inventoryStatus category price')
      .populate('category', 'name');
    
    res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get low stock items (fewer than specified threshold)
// @route   GET /api/inventory/low-stock/:threshold?
// @access  Private/Admin
router.get('/low-stock/:threshold?', isAuth, isAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.params.threshold) || 10; // Default threshold is 10
    
    // Find products with low main stock
    const lowStockItems = await Product.find({ stock: { $lt: threshold } })
      .select('name stock variants category price')
      .populate('category', 'name');
    
    // Find products with low variant stock
    const lowVariantStockItems = await Product.find({
      variants: { $elemMatch: { stock: { $lt: threshold } } }
    })
      .select('name stock variants category price')
      .populate('category', 'name');
    
    // Combine and deduplicate results
    const combinedResults = [...lowStockItems];
    
    // Add products with low variant stock if they're not already included
    lowVariantStockItems.forEach(product => {
      if (!combinedResults.some(p => p._id.toString() === product._id.toString())) {
        combinedResults.push(product);
      }
    });
    
    res.status(200).json(combinedResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Bulk update inventory
// @route   PUT /api/inventory/bulk-update
// @access  Private/Admin
router.put('/bulk-update', isAuth, isAdmin, async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Invalid updates format' });
    }
    
    const results = [];
    
    for (const update of updates) {
      const { productId, stock, location, status, variants } = update;
      
      const product = await Product.findById(productId);
      
      if (!product) {
        results.push({ productId, success: false, message: 'Product not found' });
        continue;
      }
      
      // Update main stock if provided
      if (stock !== undefined) {
        product.stock = stock;
      }
      
      // Update inventory location if provided
      if (location) {
        // Add location field if it doesn't exist yet
        if (!product.inventoryLocation) {
          product.inventoryLocation = location;
        } else {
          product.inventoryLocation = location;
        }
      }
      
      // Update inventory status if provided
      if (status) {
        // Add status field if it doesn't exist yet
        if (!product.inventoryStatus) {
          product.inventoryStatus = status;
        } else {
          product.inventoryStatus = status;
        }
      }
      
      // Update variants if provided
      if (variants && Array.isArray(variants)) {
        variants.forEach(updatedVariant => {
          const existingVariantIndex = product.variants.findIndex(
            v => v.size === updatedVariant.size && v.color === updatedVariant.color
          );
          
          if (existingVariantIndex >= 0) {
            product.variants[existingVariantIndex].stock = updatedVariant.stock;
          } else {
            product.variants.push(updatedVariant);
          }
        });
      }
      
      await product.save();
      results.push({ productId, success: true });
    }
    
    res.status(200).json({ results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;