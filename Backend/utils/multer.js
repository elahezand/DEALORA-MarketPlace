const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const paths = {
  pics: path.join(__dirname, "..", "public", "posts", "images"),
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
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.mkv'];
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

module.exports = upload;