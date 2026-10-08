const logger = require("../utils/logger");

/* Turns library errors that are really the client's fault into 4xx instead of 500 */
const normalize = (err) => {
  if (err?.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Image is too large (max 5MB)"
      : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE" ? "Too many files"
        : err.message;
    return { status: 400, message, isOperational: true };
  }
  if (/^(File extension not allowed|Invalid mimetype|No path defined for field)/.test(err?.message || "")) {
    return { status: 400, message: err.message, isOperational: true };
  }
  if (err?.message === "Not allowed by CORS") {
    return { status: 403, message: err.message, isOperational: true };
  }
  if (err?.name === "CastError") {
    return { status: 400, message: `Invalid ${err.path}`, isOperational: true };
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "value";
    return { status: 409, message: `This ${field} is already taken`, isOperational: true };
  }
  if (err?.type === "entity.too.large") {
    return { status: 413, message: "Request body is too large", isOperational: true };
  }
  return null;
};

const errorHandler = (err, req, res, next) => {
  const known = normalize(err);
  const status = known?.status || err.status || err.statusCode || 500;
  const isOperational = known?.isOperational || err.isOperational;
  // never leak internal messages (stack details, db errors) on a 500
  const message = known?.message || (status >= 500 && !isOperational ? "Internal Server Error" : err.message || "Internal Server Error");

  if (status >= 500 || !isOperational) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status} ${message}`);
  }

  const body = { success: false, message };

  if (err.errors !== undefined && isOperational) body.errors = err.errors;
  if (err.details !== undefined) body.details = err.details;

  res.status(status).json(body);
};

module.exports = errorHandler;
