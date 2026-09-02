
class AppError extends Error {
  /**
   * @param {number} status - HTTP status code to send back to the client
   * @param {string} message - human-readable message
   * @param {object} [extra] - optional extra fields merged into the error (e.g. { code: "OTP_EXPIRED" })
   */
  constructor(status = 500, message = "Internal Server Error", extra = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.isOperational = true;
    Object.assign(this, extra);
    Error.captureStackTrace?.(this, AppError);
  }
}

module.exports = AppError;
