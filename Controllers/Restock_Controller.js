// ===============================================================
//  Restock_Controller.js
//  Handles the processing of incoming supplier deliveries.
//  Uses MongoDB Transactions to securely log the delivery and
//  increase the store's inventory quantity simultaneously.
//  Integrated with Audit_Service.js to log restock activity.
// ===============================================================

const Restock = require('../Models/Restocks');
const Product = require('../Models/Products');
const Supplier = require('../Models/Suppliers');
const PM = require('mongoose');
const AuditService = require('../Services/Audit_Services');

// ==============================================================
// PROCESS INCOMING DELIVERY (RESTOCK)
// Route  : POST /api/restock
// Access : Store_Keeper, Admin, Super_Admin
// ==============================================================
exports.ProcessRestock = async (req, res) => {
  // Start a MongoDB session to enable the transaction bubble
  const session = await PM.startSession();
  session.startTransaction();

  try {
    // Destructure delivery details from the request body
    const { 
      productId, 
      supplierId, 
      quantityAdded, 
      unitCost, 
      batchNumber, 
      expiryDate, 
      notes 
    } = req.body;

    // Validate mandatory fields
    if (!productId || !supplierId || !quantityAdded || unitCost === undefined) {
      return res.status(400).json({ message: 'Please provide productId, supplierId, quantityAdded, and unitCost' });
    }

    // Step 1: Verify the Supplier exists
    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier || !supplier.isActive) {
      throw new Error('Supplier not found or is currently inactive');
    }

    // Step 2: Verify the Product exists
    const product = await Product.findById(productId).session(session);
    if (!product || !product.isActive) {
      throw new Error('Product not found or is currently inactive');
    }

    // Step 3: Update the Product Inventory
    // We add the newly delivered boxes to the existing stock
    product.quantity += Number(quantityAdded);
    
    // Update the cost price if the supplier changed their prices
    product.costPrice = Number(unitCost); 
    
    // If the new batch has an expiry date, update the product's current expiry
    if (expiryDate) {
      product.expiryDate = new Date(expiryDate);
    }
    
    // Save the updated product data
    await product.save({ session });

    // Step 4: Generate a unique Delivery Number (e.g., DEL-20260903-789012)
    const datePrefix = new Date().toISOString().split('T').replace(/-/g, '');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000); 
    const deliveryNumber = `DEL-${datePrefix}-${randomSuffix}`;

    // Step 5: Create the Restock Ledger Entry
    // We get the staff member's ID from req.user (injected by auth.js)
    const newRestock = new Restock({
      deliveryNumber,
      productId,
      supplierId,
      storeKeeperId: req.user.id, 
      quantityAdded: Number(quantityAdded),
      unitCost: Number(unitCost),
      batchNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      notes,
    });

    const savedRestock = await newRestock.save({ session });

    // Step 6: Commit the Transaction (Success!)
    await session.commitTransaction();
    session.endSession();

    // Step 7: Audit Log: Record successful restock processing
    await AuditService.logActivity(req, 201, 'RESTOCK_PROCESSED', {
      deliveryNumber,
      productId,
      supplierId,
      quantityAdded: Number(quantityAdded),
      unitCost: Number(unitCost)
    });

    return res.status(201).json({
      success: true,
      message: 'Restock processed successfully',
      restockRecord: savedRestock,
    });

  } catch (error) {
    // Abort and rollback all changes if anything fails
    await session.abortTransaction();
    session.endSession();

    console.error('Restock Transaction Error:', error);

    // Differentiate between our custom validation errors and server crashes
    if (error.message.includes('not found') || error.message.includes('inactive')) {
      return res.status(404).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Restock failed due to a server error', error: error.message });
  }
};

// ==============================================================
// GET RESTOCK HISTORY (THE LEDGER)
// Route  : GET /api/restock
// Access : Admin, Super_Admin
// ==============================================================
exports.GetRestockHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Fetch the ledger and populate names so the Admin sees readable data, not just ObjectIDs
    const [history, totalRecords] = await Promise.all([
      Restock.find()
        .populate('productId', 'name barcode') 
        .populate('supplierId', 'companyName') 
        .populate('storeKeeperId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Restock.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: history,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    });

  } catch (error) {
    console.error('Error fetching restock history:', error);
    return res.status(500).json({ message: 'Error fetching restock history', error: error.message });
  }
};
