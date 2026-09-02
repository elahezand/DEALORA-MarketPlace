const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (status >= 500 || !err.isOperational) {
    logger.error(`${req.method} ${req.originalUrl} ->`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status} ${message}`);
  }

  const body = { success: false, message };

  if (err.errors !== undefined) body.errors = err.errors;
  if (err.details !== undefined) body.details = err.details;

  res.status(status).json(body);
};

module.exports = errorHandler;
