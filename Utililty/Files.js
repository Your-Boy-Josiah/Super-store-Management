const fs = require("node:fs/promises");
const path = require("node:path");
const uploadRoot = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../uploads"),
);
exports.removeImage = async (image) => {
  if (typeof image !== "string" || !/^uploads\/[\w-]+\.webp$/.test(image))
    return;
  const file = path.resolve(uploadRoot, path.basename(image));
  if (path.dirname(file) !== uploadRoot) return;
  await fs.unlink(file).catch((error) => {
    if (error.code !== "ENOENT")
      console.error("Image cleanup failed:", error.message);
  });
};
exports.uploadRoot = uploadRoot;
