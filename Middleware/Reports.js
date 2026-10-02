const AccessCode = require("../Models/AccessCodes");
const User = require("../Models/Users");
exports.authorizeReport = async (req, res, next) => {
  if (["Admin", "Super_Admin"].includes(req.user.role)) return next();
  if (req.user.role !== "Store_Keeper")
    return res
      .status(403)
      .json({ message: "Reports are restricted to management" });
  try {
    const grants = await AccessCode.find({
      assignedTo: req.user.id,
      isActive: true,
      verifiedAt: { $ne: null },
      expiresAt: { $gt: new Date() },
    });
    for (const grant of grants) {
      const issuer = await User.findById(grant.generatedBy);
      if (issuer?.isActive && ["Admin", "Super_Admin"].includes(issuer.role))
        return next();
    }
    return res
      .status(403)
      .json({
        message: "Verify an administrator-issued PIN to access reports",
      });
  } catch (error) {
    next(error);
  }
};
