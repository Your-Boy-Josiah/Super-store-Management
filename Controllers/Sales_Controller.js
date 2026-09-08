// ===============================================================
//  Sales_Controller.js
//  Handles the Point of Sale (POS) checkout process and sales history.
//  Delegates the core database transaction logic to Sales_Service.js.
// ===============================================================

const Sales = require('../Models/Sales');
const SalesService = require('../Services/Sales_Services');

// ==============================================================
// PROCESS CHECKOUT (POS ROUTE)
// Route  : POST /api/sales/checkout
// Access : User (Cashier), Store_Keeper, Admin, Super_Admin
// ==============================================================
exports.ProcessCheckout = async (req, res) => {
  const { items, paymentMethod } = req.body;

  // Thin Controller Validation Checks
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Shopping cart cannot be empty' });
  }
  if (!paymentMethod) {
    return res.status(400).json({ message: 'Please select a payment method' });
  }
  if (!Array.isArray(items)) {
    return res.status(400).json({ message: 'Items must be an array' });
  }

  for (const item of items) {
    if (!item.productId || item.quantity === undefined) {
      return res.status(400).json({ message: 'Each item must have a productId and quantity' });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ message: 'Item quantity must be a positive whole number greater than zero' });
    }
  }

  try {
    // Dispatch checkout operation to the Service Layer
    const savedSale = await SalesService.executeCheckout(items, paymentMethod, req.user.id);

    return res.status(201).json({
      success: true,
      message: 'Checkout successful',
      receipt: savedSale,
    });

  } catch (error) {
    console.error('Checkout Controller Error:', error);

    // Differentiate custom business errors from server crashes
    if (error.message.includes('Insufficient stock') || error.message.includes('invalid or inactive')) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Checkout failed due to a server error', error: error.message });
  }
};

// ==============================================================
// GET SALES HISTORY
// Route  : GET /api/sales
// Access : Admin, Super_Admin (Restricted via role.js)
// ==============================================================
exports.GetSalesHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Fetch sales and populate Cashier details
    const [sales, totalSales] = await Promise.all([
      Sales.find()
        .populate('cashierId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Sales.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        totalSales,
        totalPages: Math.ceil(totalSales / limit),
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    console.error('Error fetching sales history:', error);
    return res.status(500).json({ message: 'Error fetching sales history', error: error.message });
  }
};
