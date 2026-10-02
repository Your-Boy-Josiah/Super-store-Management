require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../Models/Users");
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await User.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } },
    );
    console.log("Activated legacy accounts:", result.modifiedCount);
  } finally {
    await mongoose.disconnect();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
