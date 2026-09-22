const AppError = require("../utils/AppError");


const parseJsonBody = (req, res, next) => {
  if (typeof req.body?.data !== "string") return next();

  try {
    const parsed = JSON.parse(req.body.data);
    delete req.body.data;
    req.body = { ...req.body, ...parsed };
    next();
  } catch {
    next(new AppError(400, "Invalid JSON in \"data\" field"));
  }
};

module.exports = parseJsonBody;
