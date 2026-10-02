require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../Models/Users");
(async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_PHONE } = process.env;
  if (
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD ||
    ADMIN_PASSWORD.length < 12 ||
    !ADMIN_NAME ||
    !ADMIN_PHONE
  )
    throw new Error(
      "Set ADMIN_EMAIL, ADMIN_NAME, ADMIN_PHONE and ADMIN_PASSWORD (12+ characters)",
    );
  try {
    await mongoose.connect(process.env.MONGO_URI);
    if (await User.exists({ email: ADMIN_EMAIL.toLowerCase().trim() }))
      throw new Error("Account already exists; no account was changed");
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase().trim(),
      password: ADMIN_PASSWORD,
      phone_number: ADMIN_PHONE,
      age: 18,
      gender: "Other",
      role: "Super_Admin",
      isActive: true,
    });
    console.log(
      "Initial administrator created. Remove ADMIN_PASSWORD from your environment.",
    );
  } finally {
    await mongoose.disconnect();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
