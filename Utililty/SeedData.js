require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../Models/Users");
const Product = require("../Models/Products");
const Supplier = require("../Models/Suppliers");
(async () => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ALLOW_DEV_SEED !== "true"
  )
    throw new Error(
      "Seeding requires ALLOW_DEV_SEED=true and a non-production database",
    );
  if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 12)
    throw new Error("Set a SEED_PASSWORD of at least 12 characters");
  try {
    await mongoose.connect(process.env.MONGO_URI);
    for (const [name, email, role, phone] of [
      ["Store Owner", "owner@storeflow.test", "Super_Admin", "+2348000000001"],
      [
        "Store Keeper",
        "keeper@storeflow.test",
        "Store_Keeper",
        "+2348000000002",
      ],
      ["Cashier", "cashier@storeflow.test", "User", "+2348000000003"],
    ]) {
      if (!(await User.exists({ email })))
        await User.create({
          name,
          email,
          role,
          phone_number: phone,
          age: 25,
          gender: "Other",
          password: process.env.SEED_PASSWORD,
        });
    }
    const supplier = await Supplier.findOneAndUpdate(
      { email: "supply@storeflow.test" },
      {
        $setOnInsert: {
          companyName: "Demo Supply Co",
          email: "supply@storeflow.test",
          contactPerson: "Demo Supplier",
          phone_number: "+2348000000010",
          address: "Demo warehouse",
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    for (const [name, barcode, category, costPrice, sellingPrice, quantity] of [
      ["Coca Cola 50cl", "123456789012", "Beverages", 150, 300, 50],
      ["Fresh Bread", "987654321098", "Bakery", 500, 800, 20],
      ["Milk Powder 400g", "456123789000", "Dairy", 2000, 2800, 15],
    ]) {
      await Product.findOneAndUpdate(
        { barcode },
        {
          $setOnInsert: {
            name,
            barcode,
            category,
            costPrice,
            sellingPrice,
            quantity,
            supplierId: supplier.id,
          },
        },
        { upsert: true, new: true, runValidators: true },
      );
    }
    console.log("Demo data ready. No existing records were deleted.");
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
