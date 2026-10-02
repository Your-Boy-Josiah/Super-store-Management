const router = require("express").Router();
const controller = require("../Controllers/Access_Controller");
const { verifyToken } = require("../Middleware/Auths");
const { authorizeRoles } = require("../Middleware/Roles");
const rateLimit = require("express-rate-limit");
router.use(verifyToken);
router.post(
  "/generate",
  authorizeRoles("Admin", "Super_Admin"),
  controller.GeneratePIN,
);
router.post(
  "/verify",
  authorizeRoles("Store_Keeper"),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
  }),
  controller.VerifyPIN,
);
module.exports = router;
