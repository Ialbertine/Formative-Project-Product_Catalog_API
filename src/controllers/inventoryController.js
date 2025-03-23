const Product = require('../models/Product');

const updateInventory = async (req, res) => {
  try {
    const { stock, location, status, variants } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (stock !== undefined) product.stock = stock;
    if (location) product.inventoryLocation = location;
    if (status) product.inventoryStatus = status;

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

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAllInventory = async (req, res) => {
  try {
    const inventory = await Product.find({})
      .select('name stock variants inventoryLocation inventoryStatus category price')
      .populate('category', 'name');
    res.status(200).json(inventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getLowStockItems = async (req, res) => {
  try {
    const threshold = parseInt(req.params.threshold) || 10;

    const lowStockItems = await Product.find({ stock: { $lt: threshold } })
      .select('name stock variants category price')
      .populate('category', 'name');

    const lowVariantStockItems = await Product.find({
      variants: { $elemMatch: { stock: { $lt: threshold } } }
    })
      .select('name stock variants category price')
      .populate('category', 'name');

    const combinedResults = [...lowStockItems];
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
};

const bulkUpdateInventory = async (req, res) => {
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

      if (stock !== undefined) product.stock = stock;
      if (location) product.inventoryLocation = location;
      if (status) product.inventoryStatus = status;

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
};

module.exports = {
  updateInventory,
  getAllInventory,
  getLowStockItems,
  bulkUpdateInventory,
};