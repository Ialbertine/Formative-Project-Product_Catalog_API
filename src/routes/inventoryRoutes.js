const express = require('express');
const router = express.Router();
const { isAuth, isAdmin, hasRole } = require('../middleware/auth');
const { 
  getAllInventory, 
  getLowStockItems, 
} = require('../controllers/inventoryController');

router.get('/', isAuth, isAdmin, getAllInventory);
router.get('/low-stock/:threshold', isAuth, isAdmin, getLowStockItems);

module.exports = router;