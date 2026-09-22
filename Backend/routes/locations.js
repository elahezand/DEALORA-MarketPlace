const express = require("express");
const locationsRouter = express.Router();
const publicController = require("../controllers/public/locations");

locationsRouter.get("/",
    publicController.getAll);

module.exports = locationsRouter;
