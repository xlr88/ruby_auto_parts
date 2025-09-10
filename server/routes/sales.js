const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { recordSale, getSales, getSaleById, getSalesAnalytics, getLowStockAlerts } = require('../controllers/salesController');

const router = express.Router();

// Specific routes first
router.route('/analytics').get(protect, authorize('admin'), getSalesAnalytics);
router.route('/lowstock').get(protect, authorize('admin'), getLowStockAlerts);

// General routes next
router.route('/').post(protect, authorize('employee', 'admin'), recordSale);
router.route('/').get(protect, authorize('employee', 'admin'), getSales);
router.route('/:id').get(protect, authorize('employee', 'admin'), getSaleById);

module.exports = router;
