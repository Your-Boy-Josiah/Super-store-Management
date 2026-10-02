const router = require("express").Router();
const Supplier = require("../Models/Suppliers");
const { verifyToken } = require("../Middleware/Auths");
const { authorizeRoles } = require("../Middleware/Roles");
router.use(verifyToken, authorizeRoles("Store_Keeper", "Admin", "Super_Admin"));
router.get("/", async (req, res, next) => {
  try {
    res.json({
      data: await Supplier.find().sort({ companyName: 1 }).limit(200),
    });
  } catch (e) {
    next(e);
  }
});
const pick = (body) =>
  Object.fromEntries(
    Object.entries(body).filter(([k]) =>
      [
        "companyName",
        "contactPerson",
        "email",
        "phone_number",
        "address",
        "leadTimeDays",
        "supplyCategories",
      ].includes(k),
    ),
  );
router.post("/", async (req, res, next) => {
  try {
    res.status(201).json({ supplier: await Supplier.create(pick(req.body)) });
  } catch (e) {
    next(e);
  }
});
router.put("/:id", async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      pick(req.body),
      { new: true, runValidators: true },
    );
    if (!supplier)
      return res.status(404).json({ message: "Supplier not found" });
    res.json({ supplier });
  } catch (e) {
    next(e);
  }
});
router.delete(
  "/:id",
  authorizeRoles("Admin", "Super_Admin"),
  async (req, res, next) => {
    try {
      const supplier = await Supplier.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true },
      );
      if (!supplier)
        return res.status(404).json({ message: "Supplier not found" });
      res.json({ supplier });
    } catch (e) {
      next(e);
    }
  },
);
module.exports = router;
