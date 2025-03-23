const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { isAuth, isAdmin } = require('../middleware/auth');

// @desc    Get inventory value report
// @route   GET /api/reports/inventory-value
// @access  Private/Admin
router.get('/inventory-value', isAuth, isAdmin, async (req, res) => {
  try {
    const products = await Product.find({}).select('name price stock variants category')
      .populate('category', 'name');
    
    let totalValue = 0;
    let categoryValues = {};
    
    products.forEach(product => {
      // Calculate main stock value
      const mainStockValue = product.price * product.stock;
      
      // Calculate variants stock value
      let variantsStockValue = 0;
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          variantsStockValue += product.price * variant.stock;
        });
      }
      
      // Total value for this product
      const itemValue = mainStockValue + variantsStockValue;
      totalValue += itemValue;
      
      // Group by category
      const categoryName = product.category ? product.category.name : 'Uncategorized';
      if (!categoryValues[categoryName]) {
        categoryValues[categoryName] = 0;
      }
      categoryValues[categoryName] += itemValue;
    });
    
    // Convert to array for easier client-side processing
    const categoryValueArray = Object.entries(categoryValues).map(([category, value]) => ({
      category,
      value: parseFloat(value.toFixed(2))
    }));
    
    res.status(200).json({
      totalValue: parseFloat(totalValue.toFixed(2)),
      categories: categoryValueArray,
      productCount: products.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get stock level report
// @route   GET /api/reports/stock-levels
// @access  Private/Admin
router.get('/stock-levels', isAuth, isAdmin, async (req, res) => {
  try {
    // First get all products
    const products = await Product.find({})
      .select('name stock variants category')
      .populate('category', 'name');
    
    // Create stock level categories
    const stockLevels = {
      'Out of Stock': { count: 0, products: [] },
      'Low Stock': { count: 0, products: [] },
      'Medium Stock': { count: 0, products: [] },
      'High Stock': { count: 0, products: [] }
    };
    
    // Prepare statistics
    let totalStockItems = 0;
    let maxStock = 0;
    let minStock = Infinity;
    const stockValues = [];
    
    // Process each product
    products.forEach(product => {
      // Count main stock
      totalStockItems += product.stock;
      stockValues.push(product.stock);
      
      // Update min/max
      if (product.stock > maxStock) maxStock = product.stock;
      if (product.stock < minStock) minStock = product.stock;
      
      // Categorize by stock level
      let stockLevel;
      if (product.stock === 0) {
        stockLevel = 'Out of Stock';
      } else if (product.stock <= 5) {
        stockLevel = 'Low Stock';
      } else if (product.stock <= 20) {
        stockLevel = 'Medium Stock';
      } else {
        stockLevel = 'High Stock';
      }
      
      stockLevels[stockLevel].count++;
      stockLevels[stockLevel].products.push({
        id: product._id,
        name: product.name,
        stock: product.stock
      });
      
      // Count variant stock if present
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          totalStockItems += variant.stock;
          stockValues.push(variant.stock);
          
          // Update min/max for variants
          if (variant.stock > maxStock) maxStock = variant.stock;
          if (variant.stock < minStock) minStock = variant.stock;
        });
      }
    });
    
    // Calculate average stock
    const avgStockPerProduct = totalStockItems / (products.length || 1);
    
    // Prepare response
    const formattedStockLevels = Object.entries(stockLevels).map(([level, data]) => ({
      level,
      count: data.count,
      products: data.products.slice(0, 5) // Limit to 5 examples per category
    }));
    
    const stats = {
      totalProducts: products.length,
      totalStockItems,
      avgStockPerProduct: parseFloat(avgStockPerProduct.toFixed(2)),
      maxStock,
      minStock: minStock === Infinity ? 0 : minStock
    };
    
    res.status(200).json({
      stockLevels: formattedStockLevels,
      stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get low stock alert report
// @route   GET /api/reports/low-stock
// @access  Private/Admin
router.get('/low-stock', isAuth, isAdmin, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    
    // Find products with low main stock
    const mainStockProducts = await Product.find({ stock: { $lte: threshold, $gt: 0 } })
      .select('name stock variants category price image')
      .populate('category', 'name');
    
    // Find products with low variant stock
    const variantStockProducts = await Product.find({
      'variants.stock': { $lte: threshold, $gt: 0 }
    })
      .select('name stock variants category price image')
      .populate('category', 'name');
    
    // Combine results without duplicates
    const lowStockProducts = [...mainStockProducts];
    
    // Add variant stock products if they aren't already included
    variantStockProducts.forEach(product => {
      if (!lowStockProducts.some(p => p._id.toString() === product._id.toString())) {
        lowStockProducts.push(product);
      }
    });
    
    // Process products to identify which variants are low
    const processedProducts = lowStockProducts.map(product => {
      // Check if main stock is low
      const isMainStockLow = product.stock <= threshold && product.stock > 0;
      
      // Find low stock variants
      const lowStockVariants = product.variants.filter(
        variant => variant.stock <= threshold && variant.stock > 0
      );
      
      return {
        _id: product._id,
        name: product.name,
        mainStock: {
          quantity: product.stock,
          isLow: isMainStockLow
        },
        lowVariants: lowStockVariants.map(v => ({
          size: v.size,
          color: v.color,
          stock: v.stock
        })),
        category: product.category,
        price: product.price,
        image: product.image
      };
    });
    
    // Sort by lowest stock first
    processedProducts.sort((a, b) => {
      // If both have low main stock, compare those values
      if (a.mainStock.isLow && b.mainStock.isLow) {
        return a.mainStock.quantity - b.mainStock.quantity;
      }
      // If only one has low main stock, prioritize it
      if (a.mainStock.isLow) return -1;
      if (b.mainStock.isLow) return 1;
      
      // If both only have low variants, compare by lowest variant
      const aLowestVariant = a.lowVariants.length > 0 
        ? Math.min(...a.lowVariants.map(v => v.stock)) 
        : Infinity;
      const bLowestVariant = b.lowVariants.length > 0 
        ? Math.min(...b.lowVariants.map(v => v.stock)) 
        : Infinity;
      
      return aLowestVariant - bLowestVariant;
    });
    
    res.status(200).json({
      products: processedProducts,
      count: processedProducts.length,
      threshold
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;