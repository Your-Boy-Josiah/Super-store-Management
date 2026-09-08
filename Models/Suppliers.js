// ===============================================================
//  Supplier.js (Model)
//  Defines the MongoDB schema for vendors and distributors.
//  Used by the Store_Keeper and Admin to track who supplies 
//  which products and how to contact them for restocks.
// ===============================================================

const PM = require('mongoose');

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const supplierSchema = new PM.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Supplier company name is required'],
      trim: true,
      index: true, // Indexed because admins will frequently search by company name
    },
    contactPerson: {
      type: String,
      required: [true, 'A primary contact person is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Supplier contact email is required'],
      unique: true, // Prevents creating duplicate supplier accounts
      lowercase: true,
      trim: true,
    },
    phone_number: {
        type: String,
      required: [true, 'Supplier phone number is required'],
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Supplier physical address is required'],
      trim: true,
    },
    // This tells us what kind of goods this supplier provides (e.g., ['Dairy', 'Beverages'])
    supplyCategories: [
      {
        type: String,
        trim: true,
      }
    ],
       // Crucial for inventory management: How many days does it take for them to deliver?
    // If milk takes 3 days to arrive, the Store_Keeper knows to reorder 3 days before stock hits zero.
    leadTimeDays: {
      type: Number,
      default: 3, 
      min: [1, 'Lead time must be at least 1 day'],
    },
    isActive: {
      type: Boolean,
      // We use a Soft Delete here. If a supplier goes out of business, 
      // we set this to false. We NEVER delete them, because past products 
      // and restock logs are permanently tied to their ID.
      default: true, 
    },
  },
  {
    // Automatically creates and updates 'createdAt' and 'updatedAt' timestamps
    timestamps: true,
  }
);
// ============================================================
// MODEL COMPILATION & EXPORT
// Compiles the schema into a usable Mongoose model.
// ============================================================

const Supplier = PM.model('Supplier', supplierSchema);

// Export the model so it can be used in controllers
module.exports = Supplier;
