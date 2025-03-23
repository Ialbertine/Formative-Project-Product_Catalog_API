const express = require('express');
const router = express.Router();
const { isAuth, isAdmin } = require('../middleware/auth');
const {
  getInventoryValueReport,
  getStockLevelReport,
  getLowStockReport,
} = require('../controllers/reportController');

router.get('/inventory-value', isAuth, isAdmin, getInventoryValueReport);
router.get('/stock-levels', isAuth, isAdmin, getStockLevelReport);
router.get('/low-stock', isAuth, isAdmin, getLowStockReport);

module.exports = router;