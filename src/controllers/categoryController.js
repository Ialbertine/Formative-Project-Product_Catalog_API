const mongoose = require('mongoose');
const Category = require('../models/category');
const Product = require('../models/product');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({ 
      name, 
      description 
    });
    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid category ID format" });
    }

    // Find the category first to check if it exists
    const existingCategory = await Category.findById(req.params.id);
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Update the category with name and description
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { 
        name: req.body.name, 
        description: req.body.description 
      },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Update error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    
    return res.status(500).json({ message: error.message });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // this will associate the category to null
    await Product.updateMany(
      { category: categoryId },
      { $set: { category: null } }
    );

    await Category.findByIdAndDelete(categoryId);
    res.status(200).json({
      message: 'Category deleted successfully and associated products updated'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};