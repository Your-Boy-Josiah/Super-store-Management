// ===============================================================
//  User_Routes
//  Handles all routing for User-related API endpoints.
//  Mounted under /api/users in app.js.
// ===============================================================

const express = require('express');
const router = express.Router(); 

// Import Controller
const UserController = require('../Controllers/User_Controller');

// Import Multer Upload Middleware
const { upload } = require('../Middleware/Uploads');

// ============================================================
// REGISTER A NEW USER
// Route  : POST /api/users/CreateUser
// Access : Public
// Payload: multipart/form-data (name, email, password, gender, phone_number, age, avatar [file])
// ============================================================
router.post(
  '/CreateUser', 
  upload.single('avatar'), 
  UserController.CreateUser
);

// ============================================================
// LOGIN USER
// Route  : POST /api/users/LoginUser
// Access : Public
// Payload: application/json (email, password)
// ============================================================
router.post('/LoginUser', UserController.LoginUser);

module.exports = router;
