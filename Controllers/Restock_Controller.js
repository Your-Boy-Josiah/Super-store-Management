const Restock = require("../Models/Restocks");
const Product = require("../Models/Products");
const Supplier = require("../Models/Suppliers");
const mongoose = require("mongoose");
const { randomUUID } = require("node:crypto");
const Audit = require("../Services/Audit_Services");
exports.ProcessRestock = async (req, res, next) => {
  const { productId, supplierId, batchNumber, expiryDate, notes } = req.body;
  const quantityAdded = Number(req.body.quantityAdded),
    unitCost = Number(req.body.unitCost);
  if (
    !mongoose.isValidObjectId(productId) ||
    !mongoose.isValidObjectId(supplierId) ||
    !Number.isSafeInteger(quantityAdded) ||
    quantityAdded <= 0 ||
    req.body.unitCost === undefined ||
    req.body.unitCost === "" ||
    !Number.isFinite(unitCost) ||
    unitCost < 0 ||
    (expiryDate && !Number.isFinite(Date.parse(expiryDate)))
  )
    return res
      .status(400)
      .json({
        message:
          "Provide valid product, supplier, positive whole quantity, nonnegative cost and expiry date",
      });
  let session;
  try {
    session = await mongoose.startSession();
    let savedRestock;
    await session.withTransaction(async () => {
      const supplier = await Supplier.findById(supplierId).session(session);
      const product = await Product.findById(productId).session(session);
      if (!supplier?.isActive || !product?.isActive)
        throw Object.assign(
          new Error("Product or supplier not found or inactive"),
          { status: 404 },
        );
      product.quantity += quantityAdded;
      product.costPrice = unitCost;
      if (expiryDate) product.expiryDate = new Date(expiryDate);
      await product.save({ session });
      const deliveryNumber =
        "DEL-" +
        new Date().toISOString().split("T")[0].replace(/-/g, "") +
        "-" +
        randomUUID();
      [savedRestock] = await Restock.create(
        [
          {
            deliveryNumber,
            productId,
            supplierId,
            storeKeeperId: req.user.id,
            quantityAdded,
            unitCost,
            batchNumber,
            expiryDate: expiryDate || undefined,
            notes,
          },
        ],
        { session },
      );
    });
    await Audit.logActivity(req, 201, "RESTOCK_PROCESSED", {
      deliveryNumber: savedRestock.deliveryNumber,
      productId,
      quantityAdded,
    });
    res.status(201).json({ success: true, restockRecord: savedRestock });
  } catch (error) {
    next(error);
  } finally {
    if (session) await session.endSession();
  }
};
exports.GetRestockHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1),
      limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const [data, totalRecords] = await Promise.all([
      Restock.find()
        .populate("productId", "name barcode")
        .populate("supplierId", "companyName")
        .populate("storeKeeperId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Restock.countDocuments(),
    ]);
    res.json({
      success: true,
      data,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};
