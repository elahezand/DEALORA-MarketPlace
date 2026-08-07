const express = require("express");
const notificationRouter = express.Router();
const controller = require("../controllers/notification");
const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId")

const validate = require("../middlewares/validate")
const { createNotificationSchema } = require("../validators/notification");

notificationRouter.get("/",
    authUser,
    authAdmin,
    controller.getAll);

notificationRouter.post("/", authUser,
    authAdmin,
    validate(createNotificationSchema),
    controller.post);

notificationRouter.get("/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    controller.get);

notificationRouter.put("/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    controller.seen);

notificationRouter.delete("/:id",
    authUser,
    authAdmin,
    validateObjectIdParam("id"),
    controller.remove);

module.exports = notificationRouter;
