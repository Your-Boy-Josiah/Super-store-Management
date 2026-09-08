// ===============================================================
//  Sales_Routes
//  Defines all HTTP routes for Point of Sale transactions.
// ===============================================================

const express = require('express');
const router = express.Router();
const SalesController = require('../Controllers/Sales_Controller');
const { verifyToken } = require('../Middleware/Auths');
const { authorizeRoles } = require('../Middleware/Roles');

// ============================================================
// PROCESS CHECKOUT
// Route  : POST /api/sales/checkout
// Access : Any logged-in staff
// ============================================================
router.post('/checkout', verifyToken, SalesController.ProcessCheckout);

// ============================================================
// GET SALES HISTORY
// Route  : GET /api/sales
// Access : Management Only (Admin, Super_Admin)
// ============================================================
router.get('/', 
  verifyToken, 
  authorizeRoles('Admin', 'Super_Admin'), 
  SalesController.GetSalesHistory
);

module.exports = router;
