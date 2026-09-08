// ===============================================================
//  Sales_Service.js
//  Handles all heavy database transactions for customer checkouts.
//  Encapsulates ACID operations to ensure inventory data consistency.
// ===============================================================

const Sales = require('../Models/Sales');
const Products = require('../Models/Products');
const PM = require('mongoose');

// ==============================================================
// EXECUTE POS CHECKOUT TRANSACTION
// Handles stock verification, deduction, and receipt generation.
// ==============================================================
exports.executeCheckout = async (items, paymentMethod, cashierId) => {
  // 1. Start a MongoDB session to enable ACID transaction safety
  const session = await PM.startSession();
  session.startTransaction();

  try {
    let totalAmount = 0;
    const processedItems = [];

    // 2. Loop through every cart item, verify stock, and calculate prices
    for (const cartItem of items) {
      const product = await Products.findById(cartItem.productId).session(session);

      if (!product || !product.isActive) {
        throw new Error(`Product with ID: ${cartItem.productId} is invalid or inactive`);
      }

      if (product.quantity < cartItem.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Only ${product.quantity} left.`);
      }

      const priceAtTimeOfSale = product.sellingPrice;
      const subTotal = priceAtTimeOfSale * cartItem.quantity;
      totalAmount += subTotal;

      processedItems.push({
        productId: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        priceAtTimeOfSale,
        subTotal,
      });

      // 3. Deduct stock safely inside the transaction session
      product.quantity -= cartItem.quantity;
      await product.save({ session });
    }

    // 4. Generate a unique receipt number
    const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const receiptNumber = `REC-${datePrefix}-${randomSuffix}`;

    // 5. Save the completed sales ledger record
    const newSale = new Sales({
      receiptNumber,
      cashierId,
      items: processedItems,
      totalAmount,
      paymentMethod,
    });

    const savedSale = await newSale.save({ session });

    // 6. Commit all writes simultaneously (All-or-Nothing)
    await session.commitTransaction();
    session.endSession();

    return savedSale;

  } catch (error) {
    // 7. Revert all changes if any single item fails during checkout
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
