// ===============================================================
//  Logger (Middleware)
//  Automatically tracks and records sensitive system actions.
//  Intercepts requests, sanitizes the data, and writes to AuditLog.
// ===============================================================

const AuditLog = require("../Models/AuditLogs");

// ==============================================================
// SYSTEM AUDIT LOGGER FUNCTION
// ==============================================================

exports.systemLogger = (req, res, next) => {
  // We ONLY want to log actions that change data (Mutations).
  // We ignore GET requests so we don't flood the database every time
  // a customer just looks at a product list.
  if (req.method === "GET") {
    return next();
  }

  // We hook into the 'finish' event of the response.
  // This means the controller has finished its job, and we now know
  // if it was successful (200/201) or if it failed/was denied (400/403/500).
  res.on("finish", async () => {
    try {
      // Security: Sanitize the payload so we NEVER log user passwords in plain text!
      const safeBody = require("../Utililty/Redact").redact(req.body || {});
      if (safeBody.password) {
        safeBody.password = "[REDACTED FOR SECURITY]";
      }

      // Construct the log entry
      const logEntry = {
        // If authenticated successfully, user will exist
        userId: req.user ? req.user.id : null,
        userRole: req.user ? req.user.role : "Guest/Unauthenticated",

        action: req.method, // POST, PUT, DELETE
        endpoint: req.originalUrl, // e.g., /api/users/register
        payload: JSON.stringify(safeBody), // The sanitized data they submitted
        ipAddress: req.ip || req.connection.remoteAddress,
        statusCode: res.statusCode, // Was it a success or an error?
      };

      // Save the log to the database silently in the background
      await AuditLog.create(logEntry);
    } catch (error) {
      // If the logger fails, we just log it to the server console.
      // We NEVER want a logging failure to crash the main application.
      console.error(
        "CRITICAL: Audit Logger Failed to write to DB:",
        error.message,
      );
    }
  });

  // Instantly pass control to the actual controller.
  // The 'finish' event above will trigger completely independently later.
  next();
};
