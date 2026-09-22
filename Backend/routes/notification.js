const express = require("express");
const notificationRouter = express.Router();
const userController = require("../controllers/user/notification");
const adminController = require("../controllers/admin/notification");
const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId")

const validate = require("../middlewares/validate")
const { createNotificationSchema } = require("../validators/notifications");

notificationRouter.get("/",
    authUser,
    userController.getAll);

// Sending a notification is still admin-to-admin only.
notificationRouter.post("/", authUser,
    authAdmin,
    validate(createNotificationSchema),
    adminController.post);

notificationRouter.get("/:id",
    authUser,
    validateObjectIdParam("id"),
    userController.get);

notificationRouter.put("/:id",
    authUser,
    validateObjectIdParam("id"),
    userController.seen);

notificationRouter.delete("/:id",
    authUser,
    validateObjectIdParam("id"),
    userController.remove);

module.exports = notificationRouter;