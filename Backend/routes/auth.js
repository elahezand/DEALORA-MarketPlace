const express = require("express");
const authRouter = express.Router();

const publicController = require("../controllers/public/auth");
const userController = require("../controllers/user/auth");
const { authUser, optionalAuth } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");

const {
    phoneSchema,
    verifySchema,
} = require("../validators/auth");

const rateLimit = require("express-rate-limit");
const otpLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        message: "Too many OTP requests.",
    },
});

const verifyLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: {
        message: "Too many verification attempts.",
    },
});

const refreshLimit = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    message: {
        message: "Too many refresh attempts.",
    },
});



authRouter.post(
    "/send",
    otpLimit,
    validate(phoneSchema),
    publicController.send
);

authRouter.post(
    "/verify",
    verifyLimit,
    validate(verifySchema),
    publicController.verify
);

authRouter.get(
    "/me",
    authUser,
    userController.me
);

// No authUser: logout must work even when the access token has expired
authRouter.post(
    "/logout",
    optionalAuth,
    publicController.logout
);

/* SESSIONS (active devices) */
authRouter.get("/sessions", authUser, userController.getSessions);
authRouter.post("/sessions/logout-others", authUser, userController.logoutOthers);
authRouter.delete(
    "/sessions/:id",
    authUser,
    validateObjectIdParam("id"),
    userController.revokeSession
);

authRouter.post(
    "/refresh",
    refreshLimit,
    publicController.refreshToken
);

module.exports = authRouter;