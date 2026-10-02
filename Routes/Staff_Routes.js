const router = require("express").Router();
const User = require("../Models/Users");
const { verifyToken } = require("../Middleware/Auths");
const { authorizeRoles } = require("../Middleware/Roles");
const { upload, processImage } = require("../Middleware/Uploads");
const { removeImage } = require("../Utililty/Files");
router.use(verifyToken, authorizeRoles("Admin", "Super_Admin"));
router.get("/", async (req, res, next) => {
  try {
    res.json({ data: await User.find().sort({ name: 1 }).limit(200) });
  } catch (e) {
    next(e);
  }
});
router.post(
  "/",
  upload.single("avatar"),
  processImage,
  (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400 && req.file)
        void removeImage("uploads/" + req.file.filename);
    });
    if (req.user.role !== "Super_Admin" && req.body.role === "Admin")
      return res
        .status(403)
        .json({ message: "Only a Super Admin may create an administrator" });
    next();
  },
  require("../Controllers/User_Controller").CreateUser,
);
router.patch("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.id === req.user.id || user.role === "Super_Admin")
      return res
        .status(403)
        .json({ message: "Cannot modify your own access or a Super Admin" });
    const { role, isActive } = req.body;
    if (user.role === "Admin" && req.user.role !== "Super_Admin")
      return res
        .status(403)
        .json({ message: "Only Super Admins may change administrator access" });
    if (role !== undefined) {
      if (!["User", "Store_Keeper", "Admin"].includes(role))
        return res.status(400).json({ message: "Invalid role" });
      if (role === "Admin" && req.user.role !== "Super_Admin")
        return res
          .status(403)
          .json({ message: "Only Super Admins may assign Admin" });
      user.role = role;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== "boolean")
        return res.status(400).json({ message: "isActive must be boolean" });
      user.isActive = isActive;
    }
    await user.save();
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
module.exports = router;
