// ===============================================================
//  AccessCodes.js (Model)
//  Defines the schema for temporary 6-digit Admin authorization PINs.
//  Gives Store_Keepers time-bound, shifting access to reports.
// ===============================================================

const PM = require("mongoose");

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================
const accessCodeSchema = new PM.Schema(
  {
    // The secure, random 6-digit code (hashed or raw, depending on security level)
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // The Administrator who authorized this bypass
    generatedBy: {
      type: PM.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The Store_Keeper who is granted temporary access
    assignedTo: {
      type: PM.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Original total active duration in seconds (e.g. 14400 for 4 hours)
    durationSeconds: {
      type: Number,
      required: true,
      default: 14400, // 4 hours standard
    },
    // The shifting future Date when this code will actually expire
    expiresAt: {
      type: Date,
      required: true,
    },
    verifiedAt: { type: Date, default: null },
    // Has this code been manually revoked or deactivated?
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Add an index to automatically remove expired records from MongoDB
// to keep your database light and fast
accessCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================================
// MODEL COMPILATION & EXPORT
// ============================================================
const AccessCode = PM.model("AccessCode", accessCodeSchema);
module.exports = AccessCode;
