const Sales = require("../Models/Sales");
const Products = require("../Models/Products");
const mongoose = require("mongoose");
const { randomUUID } = require("node:crypto");
exports.executeCheckout = async (items, paymentMethod, cashierId) => {
  const session = await mongoose.startSession();
  try {
    let sale;
    await session.withTransaction(async () => {
      let totalAmount = 0;
      const processedItems = [];
      for (const item of items) {
        const product = await Products.findById(item.productId).session(
          session,
        );
        if (!product?.isActive)
          throw Object.assign(new Error("Product invalid or inactive"), {
            status: 400,
          });
        if (product.quantity < item.quantity)
          throw Object.assign(
            new Error("Insufficient stock for " + product.name),
            { status: 400 },
          );
        if (
          product.isPerishable &&
          product.expiryDate &&
          product.expiryDate < new Date()
        )
          throw Object.assign(
            new Error("Product has expired: " + product.name),
            { status: 400 },
          );
        const subTotal =
          Math.round(product.sellingPrice * item.quantity * 100) / 100;
        totalAmount = Math.round((totalAmount + subTotal) * 100) / 100;
        processedItems.push({
          productId: product._id,
          name: product.name,
          quantity: item.quantity,
          priceAtTimeOfSale: product.sellingPrice,
          subTotal,
        });
        product.quantity -= item.quantity;
        await product.save({ session });
      }
      [sale] = await Sales.create(
        [
          {
            receiptNumber:
              "REC-" +
              new Date().toISOString().slice(0, 10).replace(/-/g, "") +
              "-" +
              randomUUID(),
            cashierId,
            items: processedItems,
            totalAmount,
            paymentMethod,
          },
        ],
        { session },
      );
    });
    return sale;
  } finally {
    await session.endSession();
  }
};
