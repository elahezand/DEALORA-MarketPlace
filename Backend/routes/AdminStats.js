
const express = require("express");
const adminStatsRouter = express.Router();

const controller = require("../controllers/adminStats");
const { authUser, authAdmin } = require("../middlewares/authMiddleware");

adminStatsRouter.get("/", authUser, authAdmin, controller.getStats);

module.exports = adminStatsRouter;

