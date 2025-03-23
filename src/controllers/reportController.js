const Product = require('../models/Product');

const getInventoryValueReport = async (req, res) => {
  try {
    const products = await Product.find({})
      .select('name price stock variants category')
      .populate('category', 'name');

    let totalValue = 0;
    let categoryValues = {};

    products.forEach(product => {
      const mainStockValue = product.price * product.stock;
      let variantsStockValue = 0;

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          variantsStockValue += product.price * variant.stock;
        });
      }

      const itemValue = mainStockValue + variantsStockValue;
      totalValue += itemValue;

      const categoryName = product.category ? product.category.name : 'Uncategorized';
      if (!categoryValues[categoryName]) {
        categoryValues[categoryName] = 0;
      }
      categoryValues[categoryName] += itemValue;
    });

    const categoryValueArray = Object.entries(categoryValues).map(([category, value]) => ({
      category,
      value: parseFloat(value.toFixed(2)),
    }));

    res.status(200).json({
      totalValue: parseFloat(totalValue.toFixed(2)),
      categories: categoryValueArray,
      productCount: products.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getStockLevelReport = async (req, res) => {
  try {
    const products = await Product.find({})
      .select('name stock variants category')
      .populate('category', 'name');

    const stockLevels = {
      'Out of Stock': { count: 0, products: [] },
      'Low Stock': { count: 0, products: [] },
      'Medium Stock': { count: 0, products: [] },
      'High Stock': { count: 0, products: [] },
    };

    let totalStockItems = 0;
    let maxStock = 0;
    let minStock = Infinity;
    const stockValues = [];

    products.forEach(product => {
      totalStockItems += product.stock;
      stockValues.push(product.stock);

      if (product.stock > maxStock) maxStock = product.stock;
      if (product.stock < minStock) minStock = product.stock;

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
        stock: product.stock,
      });

      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          totalStockItems += variant.stock;
          stockValues.push(variant.stock);

          if (variant.stock > maxStock) maxStock = variant.stock;
          if (variant.stock < minStock) minStock = variant.stock;
        });
      }
    });

    const avgStockPerProduct = totalStockItems / (products.length || 1);

    const formattedStockLevels = Object.entries(stockLevels).map(([level, data]) => ({
      level,
      count: data.count,
      products: data.products.slice(0, 5),
    }));

    const stats = {
      totalProducts: products.length,
      totalStockItems,
      avgStockPerProduct: parseFloat(avgStockPerProduct.toFixed(2)),
      maxStock,
      minStock: minStock === Infinity ? 0 : minStock,
    };

    res.status(200).json({
      stockLevels: formattedStockLevels,
      stats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getLowStockReport = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;

    const mainStockProducts = await Product.find({ stock: { $lte: threshold, $gt: 0 } })
      .select('name stock variants category price image')
      .populate('category', 'name');

    const variantStockProducts = await Product.find({
      'variants.stock': { $lte: threshold, $gt: 0 },
    })
      .select('name stock variants category price image')
      .populate('category', 'name');

    const lowStockProducts = [...mainStockProducts];

    variantStockProducts.forEach(product => {
      if (!lowStockProducts.some(p => p._id.toString() === product._id.toString())) {
        lowStockProducts.push(product);
      }
    });

    const processedProducts = lowStockProducts.map(product => {
      const isMainStockLow = product.stock <= threshold && product.stock > 0;
      const lowStockVariants = product.variants.filter(
        variant => variant.stock <= threshold && variant.stock > 0,
      );

      return {
        _id: product._id,
        name: product.name,
        mainStock: {
          quantity: product.stock,
          isLow: isMainStockLow,
        },
        lowVariants: lowStockVariants.map(v => ({
          size: v.size,
          color: v.color,
          stock: v.stock,
        })),
        category: product.category,
        price: product.price,
        image: product.image,
      };
    });

    processedProducts.sort((a, b) => {
      if (a.mainStock.isLow && b.mainStock.isLow) {
        return a.mainStock.quantity - b.mainStock.quantity;
      }
      if (a.mainStock.isLow) return -1;
      if (b.mainStock.isLow) return 1;

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
      threshold,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getInventoryValueReport,
  getStockLevelReport,
  getLowStockReport,
};