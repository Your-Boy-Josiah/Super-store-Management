// ============================================================
//  Product_Routes
//  Defines all HTTP routes for the Product resource.
//  Imported by app.js and mounted under /api/products.
// ============================================================

const express = require('express');
const router = express.Router();

// Import Controller
const ProductController = require('../Controllers/Product_Controller');

// Import Security Middlewares
const { verifyToken } = require('../Middleware/Auths');
const { authorizeRoles } = require('../Middleware/Roles');

// Import Multer Upload & Image Processing Middlewares
const { upload, processImage } = require('../Middleware/Uploads');

// ============================================================
// GET ALL PRODUCTS  (Pagination + Search + Filters)
// Access : Any logged-in staff
// ============================================================
router.get('/', verifyToken, ProductController.GetProducts);

// ============================================================
// GET PRODUCT BY BARCODE  (POS Scanner Lookup)
// Access : Any logged-in staff
// ============================================================
router.get('/barcode/:barcode', verifyToken, ProductController.GetProductByBarcode);

// ============================================================
// CREATE A NEW PRODUCT
// Access : Store_Keeper, Admin, Super_Admin
// Payload: multipart/form-data with optional 'image' file
// ============================================================
router.post(
  '/CreateProduct', 
  verifyToken, 
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), 
  upload.single('image'), 
  processImage,
  ProductController.CreateProduct
);

// ============================================================
// UPDATE A PRODUCT
// Access : Store_Keeper, Admin, Super_Admin
// Payload: multipart/form-data or application/json with optional 'image' file
// ============================================================
router.put(
  '/:id', 
  verifyToken, 
  authorizeRoles('Store_Keeper', 'Admin', 'Super_Admin'), 
  upload.single('image'), 
  processImage,
  ProductController.UpdateProduct
);

// ============================================================
// SOFT DELETE A PRODUCT  (Archive / Deactivate)
// Access : Management Only (Admin, Super_Admin)
// ============================================================
router.delete(
  '/:id', 
  verifyToken,  
  authorizeRoles('Admin', 'Super_Admin'), 
  ProductController.DeleteProduct
);

// Export the router to be mounted in app.js
module.exports = router;
