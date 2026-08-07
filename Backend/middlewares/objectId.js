const { isValidObjectId } = require("mongoose");

const validateObjectIdParam = (paramName = "id") => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!isValidObjectId(value)) {
      return res.status(400).json({
        message: `Invalid ${paramName} ID`
      });
    }

    next();
  };
};

module.exports = validateObjectIdParam;