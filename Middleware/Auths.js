const jwt = require("jsonwebtoken");
const User = require("../Models/Users");
exports.verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ message: "Please log in" });
  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return res
      .status(401)
      .json({ message: "Session expired or invalid. Please log in again." });
  }
  try {
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive)
      return res
        .status(401)
        .json({ message: "Account is inactive or unavailable" });
    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (error) {
    next(error);
  }
};
