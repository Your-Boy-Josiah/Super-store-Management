// ===============================================================
//  AuditLog.js (Model)
//  Defines the MongoDB schema for system-wide activity tracking.
//  Acts as a permanent, unalterable ledger of who did what, 
//  when they did it, and what data was changed.
// ===============================================================

const PM = require('mongoose');

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const auditLogSchema = new PM.Schema(
  {
    // The staff member who performed the action
    userId: {
      type: PM.Schema.Types.ObjectId,
      ref: 'User',
      // We don't make this strictly required because someone might fail 
      // to log in, and we still want to log that failed attempt!
    },
    // Their role at the time they did it
    userRole: {
      type: String,
      default: 'Unknown/Guest',
    },
    // The HTTP method used (e.g., POST, PUT, DELETE)
    action: {
      type: String,
      required: true,
    },
    // The exact endpoint they hit (e.g., /api/products/delete/123)
    endpoint: {
      type: String,
      required: true,
    },
    // A stringified version of what they submitted (we must strip passwords out first!)
    payload: {
      type: String,
      default: '{}',
    },
    // The IP address of the computer/device they used
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    // Did their action succeed (200/201) or fail (400/401/403/500)?
    statusCode: {
      type: Number,
      required: true,
    },
  },
  {
    // Automatically creates 'createdAt' (The exact timestamp of the action)
    timestamps: true,
    
    // Security Feature: Prevent Mongoose from creating an 'updatedAt' field 
    // because audit logs should NEVER be updated once written!
    updatedAt: false, 
  }
);

// ============================================================
// MODEL COMPILATION & EXPORT
// ============================================================

const AuditLog = PM.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
