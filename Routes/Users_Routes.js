const router = require("express").Router();
const UserController = require("../Controllers/User_Controller");
const { upload, processImage } = require("../Middleware/Uploads");
const { removeImage } = require("../Utililty/Files");
// Uploaded files are removed whenever registration is rejected.
router.post(
  "/CreateUser",
  (req, res, next) => {
    if (process.env.ALLOW_PUBLIC_SIGNUP !== "true")
      return res
        .status(403)
        .json({ message: "Ask an administrator to create your account" });
    next();
  },
  upload.single("avatar"),
  processImage,
  (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400 && req.file)
        void removeImage("uploads/" + req.file.filename);
    });
    next();
  },
  UserController.CreateUser,
);
router.post("/LoginUser", UserController.LoginUser);
module.exports = router;
