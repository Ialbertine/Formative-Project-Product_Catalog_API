const Product = require('../models/Product');

const searchProducts = async (req, res) => {
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
      limit = 10,
    } = req.query;

    const query = {};

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (category) query.category = category;

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    if (inStock === 'true') query.stock = { $gt: 0 };
    else if (inStock === 'false') query.stock = 0;

    if (size || color) {
      const variantFilter = {};
      if (size) variantFilter['variants.size'] = size;
      if (color) variantFilter['variants.color'] = color;
      if (inStock === 'true') variantFilter['variants.stock'] = { $gt: 0 };
      if (Object.keys(variantFilter).length > 0) {
        query.$and = query.$and || [];
        query.$and.push(variantFilter);
      }
    }

    let sort = {};
    switch (sortBy) {
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
        sort = { createdAt: -1 };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      products,
      page: pageNum,
      pages: totalPages,
      total,
      hasMore: pageNum < totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const { term, limit = 5 } = req.query;

    if (!term || term.length < 2) return res.status(200).json([]);

    const suggestions = await Product.find({
      name: { $regex: term, $options: 'i' },
    })
      .select('name _id')
      .limit(Number(limit));

    res.status(200).json(suggestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const searchByVariants = async (req, res) => {
  try {
    const { size, color, inStock } = req.query;

    if (!size && !color) {
      return res.status(400).json({ message: 'Provide at least size or color' });
    }

    const query = { variants: { $elemMatch: {} } };
    if (size) query.variants.$elemMatch.size = size;
    if (color) query.variants.$elemMatch.color = { $regex: new RegExp(`^${color}$`, 'i') }; // Case-insensitive match
    if (inStock === 'true') query.variants.$elemMatch.stock = { $gt: 0 };

    // Find products that have at least one matching variant
    const products = await Product.find(query).populate('category', 'name');

    // Extract and return only the matching variants with product info
    const results = products.flatMap(product => {
      const matchingVariants = product.variants.filter(variant => {
        const sizeMatch = !size || variant.size === size;
        const colorMatch = !color || variant.color.toLowerCase() === color.toLowerCase();
        const stockMatch = inStock !== 'true' || variant.stock > 0;
        return sizeMatch && colorMatch && stockMatch;
      });

      return matchingVariants.map(variant => ({
        productId: product._id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        category: product.category,
        ...variant.toObject()
      }));
    });

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { searchProducts, getSuggestions, searchByVariants };