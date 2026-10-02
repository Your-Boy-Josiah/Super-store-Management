// ===============================================================
//  User_Controller.js
//  Handles all authentication and registration for the User Model.
//  Integrated with Audit_Service.js to track user activity.
//  Imported by User_Routes.js and mounted under /api/users.
// ===============================================================

const User = require("../Models/Users");
const jwt = require("jsonwebtoken");
const AuditService = require("../Services/Audit_Services");

// ==============================================================
// CREATE / REGISTER A NEW USER
// Route  : POST /api/users/CreateUser
// Access : Public
// ==============================================================
exports.CreateUser = async (req, res, next) => {
  try {
    // 1. Destructure all expected fields from the request body
    const { name, email, password, gender, phone_number, age, role } = req.body;

    // 2. Validate that all mandatory fields are present
    if (
      !name ||
      !email ||
      !password ||
      !gender ||
      !phone_number ||
      age === undefined ||
      age === ""
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (
      ![name, email, password, gender, phone_number].every(
        (value) => typeof value === "string",
      )
    )
      return res
        .status(400)
        .json({
          message: "Name, email, password, gender and phone must be text",
        });

    // 3. Normalise string data to ensure database consistency
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone_number.trim();

    // 4. Format & Casing Validations (Advanced Security Protections)

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid email address" });
    }

    // Phone number format check (supports 7-15 digits with optional '+')
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return res
        .status(400)
        .json({ message: "Please provide a valid phone number (7-15 digits)" });
    }

    // Password strength check (enforces minimum length of 8 characters)
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // Gender value validation matching our schema capitalized options
    const allowedGenders = [
      "Male",
      "Female",
      "Transgender",
      "Non-binary",
      "Other",
    ];
    const formattedGender =
      gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    if (!allowedGenders.includes(formattedGender)) {
      return res
        .status(400)
        .json({
          message:
            "Gender must be Male, Female, Transgender, Non-binary, or Other",
        });
    }

    // 5. Database Duplicate Checks
    // Check if email already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: "This Email already exists" });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone_number: normalizedPhone });
    if (existingPhone) {
      return res
        .status(409)
        .json({ message: "This Phone Number already exists" });
    }

    // 6. Handle Profile Avatar (Multer)
    const avatarPath = req.file
      ? `uploads/${req.file.filename}`
      : "uploads/default-avatar.png";

    // 7. Whitelist role (prevent unauthorized Admin / Super_Admin privilege escalation)
    const allowedSignUpRoles = req.user
      ? ["Store_Keeper", "User", "Admin"]
      : ["User"];
    const assignedRole =
      role && allowedSignUpRoles.includes(role) ? role : "User";

    // 8. Build the new User document
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      gender: formattedGender,
      phone_number: normalizedPhone,
      age: Number(age),
      avatar: avatarPath,
      role: assignedRole,
      HasAdminAccess: false, // Strict mass-assignment protection default
    });

    // 9. Persist the new user to MongoDB
    await user.save();

    // 10. Audit Log: Log the successful registration
    const tempReq = Object.create(req);
    tempReq.user = { id: user._id, role: user.role };
    await AuditService.logActivity(tempReq, 201, "USER_REGISTERED", {
      registeredUserId: user._id,
      registeredEmail: user.email,
      assignedRole: user.role,
    });

    // 11. Return the saved user (excluding password for security)
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        avatar: user.avatar,
        HasAdminAccess: user.HasAdminAccess,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue);
      return res.status(409).json({
        message: `This ${field} is already registered. Please use another. Thank You.`,
      });
    }

    console.error("Error creating user:", error);
    return next(error);
  }
};

// ==============================================================
// LOGIN USER
// Route  : POST /api/users/LoginUser
// Access : Public
// ==============================================================
exports.LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate that both email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    if (typeof email !== "string" || typeof password !== "string")
      return res
        .status(400)
        .json({ message: "Email and password must be text" });

    // 2. Query for the user by normalized email and explicitly select password field
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");
    if (!user) {
      // Audit Log: Record failed login attempt (email does not exist)
      await AuditService.logActivity(req, 401, "LOGIN_FAILED_USER_NOT_FOUND", {
        attemptedEmail: email,
      });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive)
      return res.status(401).json({ message: "Account is inactive" });

    // 3. Verify password match using model helper method
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      // Audit Log: Record failed login attempt (wrong password)
      await AuditService.logActivity(
        req,
        401,
        "LOGIN_FAILED_INCORRECT_PASSWORD",
        { attemptedEmail: email },
      );
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 4. Generate JWT token (1 hour expiration) incorporating role and admin access status
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        HasAdminAccess: user.HasAdminAccess,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // 5. Audit Log: Log the successful login
    req.user = { id: user._id, role: user.role };
    await AuditService.logActivity(req, 200, "LOGIN_SUCCESS", {
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    // 6. Return token and user metadata (including avatar and admin status)
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "uploads/default-avatar.png",
        HasAdminAccess: user.HasAdminAccess,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
