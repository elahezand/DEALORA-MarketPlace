const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const paths = {
  pics: path.join(__dirname, "..", "public", "listings", "images"),
  avatar: path.join(__dirname, "..", "public", "users", "avatars"),
};

Object.values(paths).forEach(p => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetPath = paths[file.fieldname];
    
    if (targetPath) {
      cb(null, targetPath);
    } else {
      cb(new Error(`No path defined for field: ${file.fieldname}`), false);
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `${file.fieldname}-${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("File extension not allowed"), false);
  }

  const allowedMimeTypes = {
    pics: "image/",
    avatar: "image/",
  };

  const expectedType = allowedMimeTypes[file.fieldname];

  if (expectedType && file.mimetype.startsWith(expectedType)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid mimetype for ${file.fieldname}`), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  }
});

// fileFilter above only sees the client-declared originalname/mimetype,
// both fully attacker-controlled — it can't see the actual file bytes
// (multer streams straight to disk with diskStorage). This checks the
// real magic bytes of each file *after* it's written, so a renamed
// non-image file with a spoofed "image/..." Content-Type can't get
// through. Wire this in right after upload.array()/upload.single() on
// any route that accepts image uploads.
const IMAGE_SIGNATURES = [
  (buf) => buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47, // PNG
  (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff, // JPEG
  (buf) => buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP", // WEBP
];

const isRealImage = (buffer) => IMAGE_SIGNATURES.some((check) => check(buffer));

const verifyUploadedImages = async (req, res, next) => {
  const files = req.files?.length ? req.files : req.file ? [req.file] : [];
  if (!files.length) return next();

  try {
    for (const file of files) {
      const handle = await fs.promises.open(file.path, "r");
      const buffer = Buffer.alloc(12);
      await handle.read(buffer, 0, 12, 0);
      await handle.close();

      if (!isRealImage(buffer)) {
        await Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})));
        return res.status(400).json({
          success: false,
          message: `"${file.originalname}" is not a valid image file`,
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = upload;
module.exports.verifyUploadedImages = verifyUploadedImages;