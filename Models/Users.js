// ===============================================================
//  User.js (Model)
//  Defines the MongoDB schema and business logic for Users.
//  Handles user attributes, role-based access levels, and
//  secure automated password hashing using bcrypt.
// ===============================================================

const PM = require("mongoose");
const TFA = require("bcryptjs");

// ==============================================================
// SCHEMA DEFINITION
// ==============================================================

const UserSchema = new PM.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a NAME"],
    },
    age: {
      type: Number,
      required: [true, "Please add your AGE"],
      min: [16, "You must be at least 16 years old"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Transgender", "Non-binary", "Other"],
      required: [true, "Please select your GENDER"],
    },
    email: {
      type: String,
      required: [true, "Please add your E-MAIL address"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please add a PASSWORD"],
      minlength: 6,
      select: false,
    },
    phone_number: {
      type: String,
      required: [true, "Please add your PHONE NUMBER"],
      unique: true,
    },
    avatar: {
      type: String,
      default: "uploads/default-avatar.png",
    },
    isActive: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ["Super_Admin", "Admin", "Store_Keeper", "User"],
      default: "User",
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================
// INSTANCE METHODS
// ============================================================

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await TFA.compare(enteredPassword, this.password);
};

// ============================================================
// MONGOOSE MIDDLEWARE (PRE-SAVE HOOK)
// Modern async/await hook: returns a promise instead of calling next()
// ============================================================

UserSchema.pre("save", async function () {
  // Only hash the password if it was modified or is brand new
  if (!this.isModified("password")) {
    return;
  }

  const salt = await TFA.genSalt(10);
  this.password = await TFA.hash(this.password, salt);
});

// ============================================================
// MODEL COMPILATION & EXPORT
// ============================================================

const User = PM.model("User", UserSchema);

module.exports = User;
