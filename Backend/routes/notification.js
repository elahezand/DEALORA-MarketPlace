const express = require("express");
const notificationRouter = express.Router();
const controller = require("../controllers/notification");
const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId")

const validate = require("../middlewares/validate")
const { createNotificationSchema } = require("../validators/notifications");

notificationRouter.get("/",
    authUser,
    controller.getAll);

// Sending a notification is still admin-to-admin only.
notificationRouter.post("/", authUser,
    authAdmin,
    validate(createNotificationSchema),
    controller.post);

notificationRouter.get("/:id",
    authUser,
    validateObjectIdParam("id"),
    controller.get);

notificationRouter.put("/:id",
    authUser,
    validateObjectIdParam("id"),
    controller.seen);

notificationRouter.delete("/:id",
    authUser,
    validateObjectIdParam("id"),
    controller.remove);

module.exports = notificationRouter;