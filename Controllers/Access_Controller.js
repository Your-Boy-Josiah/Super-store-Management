const AccessCode = require("../Models/AccessCodes");
const User = require("../Models/Users");
const mongoose = require("mongoose");
const { randomInt, createHmac } = require("node:crypto");
const TimeShift = require("../Utililty/Time_Shift");
const Audit = require("../Services/Audit_Services");
const hash = (code) =>
  createHmac("sha256", process.env.JWT_SECRET).update(code).digest("hex");
exports.hashPIN = hash;
exports.GeneratePIN = async (req, res, next) => {
  const { assignedTo } = req.body;
  const durationSeconds =
    req.body.durationSeconds === undefined
      ? 14400
      : Number(req.body.durationSeconds);
  if (
    !mongoose.isValidObjectId(assignedTo) ||
    !Number.isSafeInteger(durationSeconds) ||
    durationSeconds < 60 ||
    durationSeconds > 28800
  )
    return res
      .status(400)
      .json({
        message:
          "Choose a Store Keeper and a duration of 60–28800 working seconds",
      });
  try {
    const user = await User.findById(assignedTo);
    if (!user?.isActive || user.role !== "Store_Keeper")
      return res.status(400).json({ message: "Choose an active Store Keeper" });
    const pin = String(randomInt(100000, 1000000));
    const expiresAt = TimeShift.calculateShiftedExpiry(
      new Date(),
      durationSeconds,
    );
    const record = await AccessCode.create({
      code: hash(pin),
      assignedTo,
      generatedBy: req.user.id,
      durationSeconds,
      expiresAt,
    });
    await Audit.logActivity(req, 201, "ACCESS_PIN_GENERATED", {
      assignedTo,
      expiresAt,
    });
    res
      .status(201)
      .json({
        success: true,
        pin,
        expiresAt,
        assignedTo: { id: user.id, name: user.name },
        id: record.id,
      });
  } catch (error) {
    next(error);
  }
};
exports.VerifyPIN = async (req, res, next) => {
  const { code } = req.body;
  if (typeof code !== "string" || !/^\d{6}$/.test(code))
    return res.status(400).json({ message: "Provide a six-digit PIN" });
  try {
    const record = await AccessCode.findOne({
      code: hash(code),
      assignedTo: req.user.id,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    const issuer = record && (await User.findById(record.generatedBy));
    if (
      !record ||
      !issuer?.isActive ||
      !["Admin", "Super_Admin"].includes(issuer.role)
    )
      return res
        .status(403)
        .json({
          message: "PIN is invalid, expired or assigned to another user",
        });
    record.verifiedAt = new Date();
    await record.save();
    await Audit.logActivity(req, 200, "ACCESS_PIN_VERIFIED", {
      accessId: record.id,
    });
    res.json({ success: true, auth: { expiresAt: record.expiresAt } });
  } catch (error) {
    next(error);
  }
};
