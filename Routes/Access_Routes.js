// ===============================================================
//  Access_Routes.js
//  Routes for generating and verifying temporary access PINs.
//  Imports logic from Access_Controller.js and mounts under /api/access.
// ===============================================================

const express = require('express');
const router = express.Router();
const AccessController = require('../Controllers/Access_Controller');

// IMPORT YOUR AUTHENTICATION MIDDLEWARES HERE
// const { protect, restrictTo } = require('../Middleware/auth');

// ==============================================================
// ACCESS PIN ROUTE DEFINITIONS
// ==============================================================

// 1. Generate a temporary PIN (Admin or Super_Admin only)
// POST /api/access/generate
// router.post('/generate', protect, restrictTo('Admin', 'Super_Admin'), AccessController.GeneratePIN);
router.post('/generate', AccessController.GeneratePIN);

// 2. Verify a PIN to bypass module locks
// POST /api/access/verify
router.post('/verify', AccessController.VerifyPIN);

module.exports = router;
