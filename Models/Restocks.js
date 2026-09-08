// ===============================================================
//  Restock.js (Model)
//  Defines the MongoDB schema for inventory inflows.
//  Acts as a permanent ledger tracking exactly when new stock 
//  arrived, who supplied it, and which staff member received it.
// ===============================================================

const PM = require('mongoose');

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const restockSchema = new PM.Schema(
  {
    // A unique, human-readable delivery identifier (e.g., "DEL-20260903-1234")
    deliveryNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // The exact product being restocked
    productId: {
      type: PM.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    // The vendor who delivered the items
    supplierId: {
      type: PM.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier ID is required'],
    },
    // The Store Keeper or Admin who physically received the delivery
    storeKeeperId: {
      type: PM.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'The ID of the staff member receiving the stock is required'],
    },
    // How many units were delivered off the truck?
    quantityAdded: {
      type: Number,
      required: [true, 'Quantity added is required'],
      min: [1, 'Must restock at least 1 item'],
    },
    // What the supplier charged us *today* (Supplier prices fluctuate!)
    unitCost: {
      type: Number,
      required: [true, 'Unit cost from the supplier is required'],
      min: [0, 'Unit cost cannot be negative'],
    },
    // Optional tracking for perishable goods
    batchNumber: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
    // Any damage reports or notes about the delivery
    notes: {
      type: String,
      trim: true,
      default: '',
    }
  },
  {
    // Automatically creates 'createdAt' (Exact time the truck was unloaded/logged)
    timestamps: true,
  }
);

// ============================================================
// MODEL COMPILATION & EXPORT
// ============================================================

const Restock = PM.model('Restock', restockSchema);
module.exports = Restock;
