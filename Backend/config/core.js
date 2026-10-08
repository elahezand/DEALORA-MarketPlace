const AppError = require("../utils/AppError");

let whiteList = ["http://localhost:3000", "http://localhost:5173"];

if (process.env.ALLOWED_ORIGINS) {
  whiteList = process.env.ALLOWED_ORIGINS.split(",").map((item) => item.trim());
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whiteList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError(403, "Not allowed by CORS"));
    }
  },
  credentials: true,
};

module.exports = { corsOptions };