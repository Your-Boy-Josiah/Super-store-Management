// ============================================================
//  Upload
//  Handles file uploads via Multer and converts images to WebP via Sharp.
//  Imported as middleware into resource route files.
// ============================================================

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ============================================================
// UPLOAD DIRECTORY SETUP
// Ensures the destination folder exists on disk before saving
// ============================================================
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================================
// STORAGE CONFIGURATION (In-Memory)
// Holds incoming raw files in RAM so Sharp can convert them
// ============================================================
const storage = multer.memoryStorage();

// ============================================================
// FILE TYPE FILTER
// Accepts standard web formats plus iPhone HEIC/HEIF images
// ============================================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Please upload an image file (JPEG, PNG, WebP, or HEIC).'), false);
  }
};

// ============================================================
// MULTER INSTANCE
// Enforces memory storage, file validation, and a 15MB limit
// ============================================================
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB Max
});

// ============================================================
// IMAGE PROCESSING MIDDLEWARE (Sharp -> WebP)
// Converts raw memory buffer to high-quality .webp on disk
// ============================================================
const processImage = async (req, res, next) => {
  // If no file was provided in the request, proceed to next step
  if (!req.file) return next();

  // Generate unique filename ending with .webp
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const outputPath = path.join(uploadDir, filename);

  try {
    // Convert to WebP format at 85% quality and save to disk
    await sharp(req.file.buffer)
      .webp({ quality: 85 })
      .toFile(outputPath);

    // Update req.file properties for subsequent controller use
    req.file.path = outputPath;
    req.file.filename = filename;
    req.file.mimetype = 'image/webp';

    // Clear memory buffer
    delete req.file.buffer;

    next();
  } catch (error) {
    next(new Error(`Image conversion failed: ${error.message}`));
  }
};

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  upload,
  processImage,
};
