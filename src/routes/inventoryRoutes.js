const express = require('express');
const router = express.Router();
const { isAuth, isAdmin, hasRole } = require('../middleware/auth');
const { 
  updateInventory, 
  getAllInventory, 
  getLowStockItems, 
  bulkUpdateInventory 
} = require('../controllers/inventoryController');

router.put('/inventory/:id', isAuth, isAdmin, updateInventory);
router.post('/inventory/bulk-update', isAuth, isAdmin, bulkUpdateInventory);
router.get('/inventory', isAuth, hasRole(['admin']), getAllInventory);
router.get('/inventory/low-stock/:threshold', isAuth, hasRole(['admin']), getLowStockItems);

module.exports = router;