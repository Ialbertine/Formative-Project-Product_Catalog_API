const Product = require('../models/Product');

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

module.exports = {
  getAllInventory,
  getLowStockItems,
};