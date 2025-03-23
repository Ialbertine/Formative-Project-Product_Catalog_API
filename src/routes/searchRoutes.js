const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// @desc    Search products with filtering and pagination
// @route   GET /api/search
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      inStock,
      size,
      color,
      sortBy,
      page = 1,
      limit = 10
    } = req.query;
    
    // Build query
    const query = {};
    
    // Keyword search (search in name and description)
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }
    
    // Stock availability filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    } else if (inStock === 'false') {
      query.stock = 0;
    }
    
    // Variant filters (size and color)
    if (size || color) {
      const variantFilter = {};
      
      if (size) {
        variantFilter['variants.size'] = size;
      }
      
      if (color) {
        variantFilter['variants.color'] = color;
      }
      
      // If stock also matters for variants
      if (inStock === 'true') {
        variantFilter['variants.stock'] = { $gt: 0 };
      }
      
      // Add variant filter to main query
      if (Object.keys(variantFilter).length > 0) {
        query.$and = query.$and || [];
        query.$and.push(variantFilter);
      }
    }
    
    // Determine sort order
    let sort = {};
    switch(sortBy) {
      case 'priceAsc':
        sort = { price: 1 };
        break;
      case 'priceDesc':
        sort = { price: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'nameAsc':
        sort = { name: 1 };
        break;
      default:
        sort = { createdAt: -1 }; // Default sort by newest
    }
    
    // Calculate pagination values
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with pagination
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    // Calculate pages
    const totalPages = Math.ceil(total / limitNum);
    
    res.status(200).json({
      products,
      page: pageNum,
      pages: totalPages,
      total,
      hasMore: pageNum < totalPages
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get product suggestions (autocomplete)
// @route   GET /api/search/suggestions
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const { term, limit = 5 } = req.query;
    
    if (!term || term.length < 2) {
      return res.status(200).json([]);
    }
    
    const suggestions = await Product.find({
      name: { $regex: term, $options: 'i' }
    })
      .select('name _id')
      .limit(Number(limit));
    
    res.status(200).json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Search products by variant (size and color)
// @route   GET /api/search/variants
// @access  Public
router.get('/variants', async (req, res) => {
  try {
    const { size, color, inStock } = req.query;
    
    if (!size && !color) {
      return res.status(400).json({ message: 'Please provide at least size or color' });
    }
    
    const query = { 
      variants: { $elemMatch: {} }
    };
    
    if (size) {
      query.variants.$elemMatch.size = size;
    }
    
    if (color) {
      query.variants.$elemMatch.color = color;
    }
    
    if (inStock === 'true') {
      query.variants.$elemMatch.stock = { $gt: 0 };
    }
    
    const products = await Product.find(query)
      .populate('category', 'name');
    
    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;