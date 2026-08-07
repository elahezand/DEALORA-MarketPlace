const express = require("express");
const locationsRouter = express.Router();
const controller = require("../controllers/locations");

locationsRouter.get("/",
    controller.getAll);

module.exports = locationsRouter;
