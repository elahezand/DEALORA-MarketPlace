const User = require("../models/user");
const Ban = require("../models/ban");
const { hash, compare } = require("bcryptjs");
const crypto = require("crypto");
const axios = require("axios");
const redisClient = require("../redis");

const {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/auth");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
/* OTP UTIL*/
const getOtpKey = (phone) => `otp:${phone}`;

const getOtpDetails = async (phone) => {
  const ttl = await redisClient.ttl(getOtpKey(phone));
  if (ttl <= 0) {
    return {
      expired: true,
      remainingTime: "00:00",
    };
  }

  const minutes = Math.floor(ttl / 60);
  const seconds = ttl % 60;

  return {
    expired: false,
    remainingTime: `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`,
  };
};

/* SEND OTP*/
exports.send = async (req, res, next) => {
  try {
    const { phone } = req.parsed.data;

    const isBanned = await Ban.findOne({ phone });
    if (isBanned) {
      return next({
        status: 403,
        message: "User is banned",
      });
    }

    const { expired, remainingTime } =
      await getOtpDetails(phone);

    if (!expired) {
      return next({
        status: 429,
        message: `Try again after ${remainingTime}`,
      });
    }

    const code = crypto.randomInt(10000, 99999);

    try {
      await axios.post(
        "http://ippanel.com/api/select",
        {
          op: "pattern",
          user: process.env.SMS_USER,
          pass: process.env.SMS_PASS,
          fromNum: "3000505",
          toNum: phone,
          patternCode: process.env.SMS_PATTERN,
          inputData: [
            {
              "verification-code": code,
            },
          ],
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );
    } catch (err) {
      return next({
        status: 500,
        message: "SMS service failed",
      });
    }

    const hashedOtp = await hash(
      String(code),
      10
    );

    await redisClient.set(
      getOtpKey(phone),
      hashedOtp,
      "EX",
      60
    );

    res.status(200).json({
      message: "OTP sent successfully"
    });
  } catch (err) {
    next(err);
  }
};

/*  VERIFY OTP */
exports.verify = async (req, res, next) => {
  try {
    const { phone, code } = req.parsed.data;
    const savedOtp = await redisClient.get(
      getOtpKey(phone)
    );

    if (!savedOtp) {
      return next({
        status: 410,
        message: "OTP expired",
      });
    }

    const isValid = await compare(
      code,
      savedOtp
    );

    if (!isValid) {
      return next({
        status: 410,
        message: "Invalid OTP",
      });
    }

    await redisClient.del(getOtpKey(phone));

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        username: phone,
        role: ["USER"],
      });
    }

    const payload = {
      id: user._id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = await generateToken(
      payload
    );

    const refreshToken = await generateRefreshToken(payload);
    user.refreshToken = await hash(
      refreshToken,
      10
    );

    await user.save();

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    const userObj = user.toObject();
    delete userObj.refreshToken;

    res.status(200).json({
      message: "Login successful",
      user: userObj,
    });
  } catch (err) {
    next(err);
  }
};

/* ME */
exports.me = async (req, res) => {
  const user = await req.user.populate("store");
  const userObj = user.toObject();
  delete userObj.refreshToken;
  return res.status(200).json({ user: userObj });
};
/* LOGOUT */
exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.updateOne(
        { _id: req.user._id },
        { $unset: { refreshToken: 1 } }
      );
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "Logged out",
    });
  } catch (err) {
    next(err);
  }
};

/* REFRESH TOKEN */

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return next({
        status: 401,
        message: "Unauthorized",
      });
    }

    const payload = await verifyRefreshToken(refreshToken);

    if (!payload) {
      res.clearCookie("accessToken", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });

      return next({
        status: 401,
        message: "Invalid token",
      });
    }

    const user = await User.findById(payload.id);

    if (!user || !user.refreshToken) {
      res.clearCookie("accessToken", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });

      return next({
        status: 401,
        message: "Session invalid",
      });
    }

    const match = await compare(refreshToken, user.refreshToken)
    if (!match) {
      res.clearCookie("accessToken", { path: "/" });
      res.clearCookie("refreshToken", { path: "/" });

      return next({
        status: 401,
        message: "Session invalid",
      });
    }


    const newAccessToken = await generateToken({
      id: user._id,
      phone: user.phone,
      role: user.role,
    });

    const newRefreshToken = await generateRefreshToken({
      id: user._id,
      phone: user.phone,
      role: user.role,
    });
    user.refreshToken = await hash(newRefreshToken, 10);
    await user.save();

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60
    });

    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.status(200).json({
      message: "Token refreshed",
    });
  } catch (err) {
    console.error("refresh error:", err);
    next(err);
  }
};