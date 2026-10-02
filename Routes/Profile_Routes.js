const router = require("express").Router();
const User = require("../Models/Users");
const { verifyToken } = require("../Middleware/Auths");
const { upload, processImage } = require("../Middleware/Uploads");
const { removeImage } = require("../Utililty/Files");
router.use(verifyToken);
router.get("/", async (req, res, next) => {
  try {
    res.json({ user: await User.findById(req.user.id) });
  } catch (e) {
    next(e);
  }
});
router.put(
  "/",
  upload.single("avatar"),
  processImage,
  async (req, res, next) => {
    let success = false;
    try {
      const user = await User.findById(req.user.id),
        old = user.avatar;
      if (req.body.name) user.name = req.body.name;
      if (req.file) user.avatar = "uploads/" + req.file.filename;
      await user.save();
      success = true;
      if (req.file) await removeImage(old);
      res.json({ user });
    } catch (e) {
      next(e);
    } finally {
      if (!success && req.file)
        await removeImage("uploads/" + req.file.filename);
    }
  },
);
module.exports = router;
