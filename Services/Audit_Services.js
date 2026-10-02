// ===============================================================
//  Audit_Service.js
//  Service helper to format and record immutable system audit logs.
//  Protects user privacy by stripping sensitive data (like passwords).
// ===============================================================

const AuditLog = require("../Models/AuditLogs"); // Imports your existing model

// ==============================================================
// RECORD A SYSTEM ACTIVITY
// Can be called manually in controllers or automated via middleware
// ==============================================================
exports.logActivity = async (
  req,
  statusCode,
  actionName,
  customPayload = null,
) => {
  try {
    // 1. Identify the user performing the action (if logged in via JWT)
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : "Guest";

    // 2. Extract client details
    const ipAddress = req.ip || req.headers?.["x-forwarded-for"] || "127.0.0.1";
    const endpoint = req.originalUrl || req.url;
    const httpMethod = req.method;

    // 3. Process the payload (request body) safely
    let finalPayload = {};

    if (customPayload) {
      finalPayload = customPayload;
    } else if (req.body) {
      // Clone req.body so we do not mutate the actual request object
      finalPayload = { ...req.body };

      // Cyber Security Precaution: Never log plain-text passwords!
      if (finalPayload.password) finalPayload.password = "********";
      if (finalPayload.confirmPassword)
        finalPayload.confirmPassword = "********";
    }

    // 4. Save the log record to the database
    const newLog = new AuditLog({
      userId,
      userRole,
      action: `${httpMethod} - ${actionName}`,
      endpoint,
      payload: JSON.stringify(
        require("../Utililty/Redact").redact(finalPayload),
      ),
      ipAddress,
      statusCode,
    });

    await newLog.save();
  } catch (error) {
    // We log to the server console but do NOT crash the server
    // if an audit log save fails
    console.error("⚠️ Critical Audit Logging Failure:", error.message);
  }
};
