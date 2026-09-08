// ===============================================================
//  Product_Controller.js
//  Handles all CRUD operations for the Product resource.
//  Imported by Routes and mounted under /api/products.
//  Integrated with Audit_Service.js to track product modifications.
// ===============================================================

const Product = require('../Models/Products');
const PM = require('mongoose');
const fs = require('fs');
const path = require('path');
const AuditService = require('../Services/Audit_Services');

// Helper tool to stop users from crashing the search with special characters like ( or *
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// Helper tool to delete old images from the server so hard drive doesn't get full
const deleteOldImage = (imagePath) => {
  // Don't try to delete if there is no image, or if it is the default placeholder
  if (!imagePath || imagePath === 'uploads/default-product.png') return;
  
  // Find the exact location of the file on the computer
  const fullPath = path.join(__dirname, '..', imagePath);
  
  // Delete it. If it fails (e.g., file already gone), just ignore and move on.
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to delete old image:', err);
    }
  });
};

// ==============================================================
// CREATE A NEW PRODUCT
// Route  : POST /api/products/CreateProduct
// Access : Store_Keeper, Admin, Super_Admin
// ==============================================================
exports.CreateProduct = async (req, res) => {
  try {
    const {
      name,
      barcode,
      sku,
      category,
      costPrice,
      sellingPrice,
      quantity,
      unit,
      size,
      reorderLevel,
      isPerishable,
      expiryDate,
      description,
      supplierId,
    } = req.body;

    // Validate mandatory fields
    if (
      !name || 
      !barcode || 
      !category || 
      !supplierId ||
      costPrice === undefined || costPrice === '' ||
      sellingPrice === undefined || sellingPrice === '' ||
      quantity === undefined || quantity === ''
    ) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, barcode, category, supplierId, costPrice, sellingPrice, and quantity.',
      });
    }

    // Check for barcode collision
    const existingBarcode = await Product.findOne({ barcode: barcode.trim() });
    if (existingBarcode) {
      return res.status(409).json({ message: 'A product with this barcode already exists' });
    }

    // Check for SKU collision if provided
    if (sku && sku.trim()) {
      const existingSku = await Product.findOne({ sku: sku.trim().toUpperCase() });
      if (existingSku) {
        return res.status(409).json({ message: 'A product with this SKU already exists' });
      }
    }

    // Handle Product Image (Multer)
    const imagePath = req.file
      ? `uploads/${req.file.filename}`
      : 'uploads/default-product.png';

    // Build the new Product document
    const product = new Product({
      name: name.trim(),
      barcode: barcode.trim(),
      sku: sku && sku.trim() ? sku.trim().toUpperCase() : undefined,
      category: category.trim(),
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity),
      unit: unit ? unit.trim() : 'pcs',
      size: size && size.trim() ? size.trim() : null,
      reorderLevel: reorderLevel !== undefined && reorderLevel !== '' ? Number(reorderLevel) : 10,
      isPerishable: String(isPerishable) === 'true',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      description: description ? description.trim() : '',
      supplierId: supplierId.trim(),
      image: imagePath,
      isActive: true,
    });

    const savedProduct = await product.save();

    // Audit Log: Record successful product creation
    await AuditService.logActivity(req, 201, 'PRODUCT_CREATED', {
      productId: savedProduct._id,
      name: savedProduct.name,
      barcode: savedProduct.barcode,
      quantity: savedProduct.quantity
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: savedProduct,
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue);
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// ============================================================
// GET ALL PRODUCTS  (Search + Filter + Pagination)
// Route  : GET /api/products?page=1&limit=20&search=milk&category=dairy&lowStock=true
// Access : Any logged-in staff
// ============================================================
exports.GetProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, category, lowStock } = req.query;
    const query = { isActive: true };

    if (search) {
      const safeSearch = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { barcode: { $regex: safeSearch, $options: 'i' } },
        { sku: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category.trim();
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// ============================================================
// GET PRODUCT BY BARCODE (For POS Scanning)
// Route  : GET /api/products/barcode/:barcode
// Access : Authenticated Staff
// ============================================================
exports.GetProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const product = await Product.findOne({ barcode: barcode.trim(), isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found with this barcode' });
    }

    return res.status(200).json({ success: true, product });

  } catch (error) {
    console.error('Error finding barcode:', error);
    return res.status(500).json({ message: 'Error scanning barcode', error: error.message });
  }
};

// ============================================================
// UPDATE A PRODUCT
// Route  : PUT /api/products/:id
// Access : Store_Keeper, Admin, Super_Admin
// ============================================================
exports.UpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!PM.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Grab the existing product FIRST so we know what its old picture was
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData = { ...req.body };

    if (updateData.sku) updateData.sku = updateData.sku.trim().toUpperCase();
    if (updateData.barcode) updateData.barcode = updateData.barcode.trim();
    if (updateData.supplierId) updateData.supplierId = updateData.supplierId.trim();
    if (updateData.costPrice !== undefined && updateData.costPrice !== '') updateData.costPrice = Number(updateData.costPrice);
    if (updateData.sellingPrice !== undefined && updateData.sellingPrice !== '') updateData.sellingPrice = Number(updateData.sellingPrice);
    if (updateData.quantity !== undefined && updateData.quantity !== '') updateData.quantity = Number(updateData.quantity);
    if (updateData.reorderLevel !== undefined && updateData.reorderLevel !== '') updateData.reorderLevel = Number(updateData.reorderLevel);
    if (updateData.isPerishable !== undefined) updateData.isPerishable = String(updateData.isPerishable) === 'true';

    // If a new product image was uploaded during the update...
    if (req.file) {
      updateData.image = `uploads/${req.file.filename}`;
      // ...delete the old image from the hard drive!
      deleteOldImage(existingProduct.image);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Audit Log: Record successful product update
    await AuditService.logActivity(req, 200, 'PRODUCT_UPDATED', {
      productId: updatedProduct._id,
      name: updatedProduct.name,
      updatedFields: Object.keys(updateData)
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue);
      return res.status(409).json({ message: `Duplicate value for ${field}` });
    }
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// ============================================================
// SOFT DELETE A PRODUCT  (Archive / Deactivation)
// Route  : DELETE /api/products/:id
// Access : Admin, Super_Admin
// ============================================================
exports.DeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!PM.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Audit Log: Record successful product deactivation
    await AuditService.logActivity(req, 200, 'PRODUCT_DEACTIVATED', {
      productId: product._id,
      name: product.name
    });

    return res.status(200).json({
      success: true,
      message: 'Product archived/deactivated successfully'
    });

  } catch (error) {
    console.error('Error archiving product:', error);
    return res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
