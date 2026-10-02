require("dotenv").config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET must contain at least 32 characters");
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
require("./Config/Database_Configs")().then(() =>
  require("./app").listen(process.env.PORT || 5000, () =>
    console.log("StoreFlow API ready"),
  ),
);
