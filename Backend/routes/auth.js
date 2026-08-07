const express = require("express");
const authRouter = express.Router();

const controller = require("../controllers/auth");
const { authUser } = require("../middlewares/authMiddleware");
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



authRouter.post(
    "/send",
    otpLimit,
    validate(phoneSchema),
    controller.send
);

authRouter.post(
    "/verify",
    verifyLimit,
    validate(verifySchema),
    controller.verify
);

authRouter.get(
    "/me",
    authUser,
    controller.me
);

authRouter.post(
    "/logout",
    authUser,
    controller.logout
);

authRouter.post(
    "/refresh",
    controller.refreshToken
);

module.exports = authRouter;