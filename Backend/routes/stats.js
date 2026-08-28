const express = require("express");
const statsRouter = express.Router();

const controller = require("../controllers/stats");
const cacheMiddleware = require("../middlewares/cache");

statsRouter.get("/", cacheMiddleware(300), controller.get);

module.exports = statsRouter;