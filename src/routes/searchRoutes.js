const express = require('express');
const router = express.Router();
const {
  searchProducts,
  getSuggestions,
  searchByVariants,
} = require('../controllers/searchController');

router.get('/', searchProducts);
router.get('/suggestions', getSuggestions);
router.get('/variants', searchByVariants);

module.exports = router;