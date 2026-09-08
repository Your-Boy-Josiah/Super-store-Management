// ===============================================================
//  Sales.js (Model)
//  Defines the MongoDB schema for point-of-sale transactions.
//  Acts as the digital receipt, recording who made the sale, 
//  what was sold, the total price, and the exact timestamp.
// ===============================================================

const PM = require('mongoose');

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const salesSchema = new PM.Schema(
  {
    // A unique, human-readable receipt identifier (e.g., "REC-20260903-1234")
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // The Cashier (User) who processed this transaction
    cashierId: {
      type: PM.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A cashier ID is required for accountability'],
    },
    // The array of products the customer bought (The Shopping Cart)
    items: [
      {
        productId: {
          type: PM.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true, // Saved so we know the item name even if the product is deleted later
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Must sell at least 1 item'],
        },
        // We lock in the price at the exact moment of checkout. 
        // If the Admin raises the price of Milk tomorrow, today's receipt shouldn't change!
        priceAtTimeOfSale: {
          type: Number,
          required: true,
        },
        // quantity * priceAtTimeOfSale
        subTotal: {
          type: Number,
          required: true,
        }
      }
    ],
    // The final amount the customer paid
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Mobile Transfer', 'POS'],
      required: [true, 'Payment method is required'],
    }
  },
  {
    // Automatically creates 'createdAt' (Exact time of sale)
    timestamps: true,
  }
);

// ============================================================
// MODEL COMPILATION & EXPORT
// ============================================================

const Sales = PM.model('Sales', salesSchema);
module.exports = Sales;
