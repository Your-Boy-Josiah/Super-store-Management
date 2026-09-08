// ===============================================================
//  Access_Controller.js
//  Handles the generation of secure, temporary 6-digit access PINs.
//  Bypasses restrictions on sales history and reporting dashboard modules.
//  Integrated with Time_Shift.js to enforce business working hours.
// ===============================================================

const AccessCode = require('../Models/AccessCodes');
const User = require('../Models/Users');
const TimeShift = require('../Utililty/Time_Shift');
const AuditService = require('../Services/Audit_Services');

// ==============================================================
// GENERATE A TEMPORARY ACCESS PIN (ADMIN-ONLY)
// Route  : POST /api/access/generate
// Access : Admin, Super_Admin
// ==============================================================
exports.GeneratePIN = async (req, res) => {
  try {
    const { assignedTo, durationSeconds } = req.body;

    // 1. Validate mandatory input
    if (!assignedTo) {
      return res.status(400).json({ message: 'Please specify the Store Keeper (assignedTo ID) for this PIN' });
    }

    // 2. Validate that the targeted user exists and is a Store_Keeper
    const targetUser = await User.findById(assignedTo);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({ message: 'Target Store Keeper not found or inactive' });
    }
    if (targetUser.role !== 'Store_Keeper') {
      return res.status(400).json({ message: 'Temporary PINs can only be generated for Store Keeper accounts' });
    }

    // 3. Generate a secure, unique 6-digit random PIN
    let pinCode;
    let codeExists = true;
    
    while (codeExists) {
      pinCode = Math.floor(100000 + Math.random() * 900000).toString();
      const duplicateCheck = await AccessCode.findOne({ code: pinCode, isActive: true });
      if (!duplicateCheck) {
        codeExists = false;
      }
    }

    // 4. Calculate the time-shifted expiration date (pauses overnight/weekends)
    const spanSeconds = durationSeconds ? Number(durationSeconds) : 14400; // 4 hours default
    const expiryDate = TimeShift.calculateShiftedExpiry(new Date(), spanSeconds);

    // 5. Save the PIN record into the database
    const newAccessCode = new AccessCode({
      code: pinCode,
      generatedBy: req.user.id, // Admin creating the PIN
      assignedTo: targetUser._id,
      durationSeconds: spanSeconds,
      expiresAt: expiryDate,
    });

    await newAccessCode.save();

    // 6. Audit Log: Log the PIN generation event
    await AuditService.logActivity(req, 201, 'ACCESS_PIN_GENERATED', {
      assignedToUser: targetUser.email,
      durationSeconds: spanSeconds,
      expiresAt: expiryDate
    });

    return res.status(201).json({
      success: true,
      message: 'Temporary PIN generated successfully',
      pin: pinCode,
      expiresAt: expiryDate,
      assignedTo: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email
      }
    });

  } catch (error) {
    console.error('Error generating PIN:', error);
    return res.status(500).json({ message: 'Error generating access PIN', error: error.message });
  }
};

// ==============================================================
// VERIFY TEMPORARY ACCESS PIN (STORE-KEEPER WORKFLOW)
// Route  : POST /api/access/verify
// Access : Public/Store_Keeper
// ==============================================================
exports.VerifyPIN = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Please provide the 6-digit PIN code to verify' });
    }

    // Find the code and populate the generator and assigned users
    const record = await AccessCode.findOne({ code: code.trim(), isActive: true })
      .populate('generatedBy', 'name email')
      .populate('assignedTo', 'name email');

    // If the PIN doesn't exist or is deactivated
    if (!record) {
      await AuditService.logActivity(req, 401, 'ACCESS_PIN_VERIFICATION_FAILED', { attemptedCode: code });
      return res.status(401).json({ message: 'Invalid or deactivated PIN' });
    }

    // If the PIN has expired based on our calendar calculations
    const now = new Date();
    if (record.expiresAt < now) {
      record.isActive = false; // Mark as inactive so we don't try to parse it again
      await record.save();

      await AuditService.logActivity(req, 401, 'ACCESS_PIN_EXPIRED', { expiredCode: code });
      return res.status(401).json({ message: 'This PIN has expired' });
    }

    // Audit Log: Record successful verification
    await AuditService.logActivity(req, 200, 'ACCESS_PIN_VERIFICATION_SUCCESS', {
      verifiedCode: '******',
      assignedToUser: record.assignedTo.email,
      authorizedBy: record.generatedBy.email
    });

    return res.status(200).json({
      success: true,
      message: 'PIN verified successfully. Temporary access granted.',
      auth: {
        assignedTo: {
          id: record.assignedTo._id,
          name: record.assignedTo.name,
          email: record.assignedTo.email,
        },
        expiresAt: record.expiresAt,
        durationRemainingSeconds: Math.max(0, Math.floor((record.expiresAt - now) / 1000))
      }
    });

  } catch (error) {
    console.error('Error verifying PIN:', error);
    return res.status(500).json({ message: 'Error verifying PIN', error: error.message });
  }
};
