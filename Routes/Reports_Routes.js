// ===============================================================
//  Reports_Routes.js
//  Routes for dashboard metrics and store reports.
//  Imports logic from Report_Controller.js and mounts under /api/reports.
// ===============================================================

const express = require('express');
const router = express.Router();
const ReportController = require('../Controllers/Report_Controller');

// IMPORT YOUR AUTHENTICATION & ROLE MIDDLEWARES HERE
// (Change these paths if your middleware files are named differently)
// const { protect, restrictTo } = require('../Middleware/auth'); 

// ==============================================================
// REPORT ROUTE DEFINITIONS
// ==============================================================

// 1. Get Dashboard Overview Metrics
// Access: Store_Keeper, Admin, Super_Admin
router.get('/dashboard-summary', ReportController.GetDashboardSummary);

// 2. Get Revenue Chart Data (30-day Historical Trend)
// Access: Admin, Super_Admin
router.get('/revenue-trend', ReportController.GetRevenueTrend);

// 3. Get Low Stock and Expiring Product Alerts
// Access: Store_Keeper, Admin, Super_Admin
router.get('/alerts', ReportController.GetAlerts);

// 4. Get Top-Selling Product Leaderboard
// Access: Admin, Super_Admin
router.get('/top-sellers', ReportController.GetTopSellers);

module.exports = router;
