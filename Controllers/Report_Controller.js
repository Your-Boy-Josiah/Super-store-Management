// ===============================================================
//  Report_Controller.js
//  Dashboard analytics engine providing real-time store performance,
//  revenue summaries, low stock warnings, and perishable goods monitoring.
//  Utilizes advanced MongoDB aggregations for high-speed reporting.
// ===============================================================

const Sales = require('../Models/Sales');
const Product = require('../Models/Products');
const Restock = require('../Models/Restocks');
const PM = require('mongoose');

// ==============================================================
// GET DASHBOARD OVERVIEW METRICS
// Route  : GET /api/reports/dashboard-summary
// Access : Admin, Super_Admin, Store_Keeper (With Authorization PIN)
// ==============================================================
exports.GetDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel execution of diverse aggregations to prevent blocking
    const [
      revenueStats,
      todayRevenue,
      lowStockCount,
      expiringCount,
      totalProducts
    ] = await Promise.all([
      // 1. All-time total revenue and total invoices issued
      Sales.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalInvoices: { $sum: 1 },
          },
        },
      ]),

      // 2. Today's cumulative revenue
      Sales.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            todayRevenue: { $sum: '$totalAmount' },
            todayTransactions: { $sum: 1 },
          },
        },
      ]),

      // 3. Count products whose stock is at or below their reorder levels
      Product.countDocuments({
        isActive: true,
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
      }),

      // 4. Count active perishable products expiring within the next 7 days
      Product.countDocuments({
        isActive: true,
        isPerishable: true,
        expiryDate: { $gte: today, $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
      }),

      // 5. Total unique active items in the database
      Product.countDocuments({ isActive: true }),
    ]);

    // Format results to prevent null outputs
    const overallRevenue = revenueStats[0]?.totalRevenue || 0;
    const overallInvoices = revenueStats[0]?.totalInvoices || 0;
    const currentDayRevenue = todayRevenue[0]?.todayRevenue || 0;
    const currentDayTransactions = todayRevenue[0]?.todayTransactions || 0;

    return res.status(200).json({
      success: true,
      summary: {
        allTimeRevenue: overallRevenue,
        allTimeSalesCount: overallInvoices,
        todayRevenue: currentDayRevenue,
        todayTransactionsCount: currentDayTransactions,
        lowStockAlertsCount: lowStockCount,
        expiringPerishablesCount: expiringCount,
        totalActiveProducts: totalProducts,
      },
    });

  } catch (error) {
    console.error('Error generating dashboard summary:', error);
    return res.status(500).json({ message: 'Error generating dashboard summary', error: error.message });
  }
};

// ==============================================================
// GET REVENUE CHART DATA (30-Day Historical Trend)
// Route  : GET /api/reports/revenue-trend
// Access : Admin, Super_Admin
// ==============================================================
exports.GetRevenueTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Aggregate sales grouped by calendar date
    const dailyTrend = await Sales.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          dailyRevenue: { $sum: '$totalAmount' },
          transactionsCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // Chronological sort
    ]);

    return res.status(200).json({
      success: true,
      data: dailyTrend,
    });

  } catch (error) {
    console.error('Error generating revenue trend:', error);
    return res.status(500).json({ message: 'Error generating revenue trend', error: error.message });
  }
};

// ==============================================================
// GET ALERTS: LOW STOCK & EXPIRING GOODS LISTS
// Route  : GET /api/reports/alerts
// Access : Admin, Super_Admin, Store_Keeper
// ==============================================================
exports.GetAlerts = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const [lowStockItems, expiringPerishables] = await Promise.all([
      // Find low stock items
      Product.find({
        isActive: true,
        $expr: { $lte: ['$quantity', '$reorderLevel'] },
      })
        .select('name barcode sku quantity reorderLevel category unit')
        .sort({ quantity: 1 }),

      // Find perishable products expiring within the next 7 days or already expired
      Product.find({
        isActive: true,
        isPerishable: true,
        expiryDate: { $lte: nextWeek },
      })
        .select('name barcode sku quantity expiryDate category')
        .sort({ expiryDate: 1 }),
    ]);

    return res.status(200).json({
      success: true,
      alerts: {
        lowStockList: lowStockItems,
        expiringList: expiringPerishables,
      },
    });

  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return res.status(500).json({ message: 'Error fetching inventory alerts', error: error.message });
  }
};

// ==============================================================
// GET TOP-SELLING PRODUCTS (Leaderboard)
// Route  : GET /api/reports/top-sellers
// Access : Admin, Super_Admin
// ==============================================================
exports.GetTopSellers = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 5));

    // Unwind shopping carts to count quantities of each product sold
    const topProducts = await Sales.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenueGenerated: { $sum: '$items.subTotal' },
        },
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: limit },
    ]);

    return res.status(200).json({
      success: true,
      data: topProducts,
    });

  } catch (error) {
    console.error('Error compiling top-selling products list:', error);
    return res.status(500).json({ message: 'Error generating top sellers list', error: error.message });
  }
};
