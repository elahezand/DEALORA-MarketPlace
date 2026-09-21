const User = require("../../models/user");
const Ban = require("../../models/ban");
const { hash, compare } = require("bcryptjs");
const crypto = require("crypto");
const axios = require("axios");
const redisClient = require("../../redis");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  verifyRefreshToken,
} = require("../../utils/auth");
const sessionService = require("../../services/shared/session");
const { clearAuthCookies } = require("../shared/auth");

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (accessToken) {
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
  }
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }
};

/* OTP UTIL*/
const OTP_TTL_SECONDS = 60;

const getOtpKey = (phone) => `otp:${phone}`;

const formatRemainingTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getOtpDetails = async (phone) => {
  const ttl = await redisClient.ttl(getOtpKey(phone));
  if (ttl <= 0) {
    return {
      expired: true,
      remainingTime: "00:00",
    };
  }

  return {
    expired: false,
    remainingTime: formatRemainingTime(ttl),
  };
};

/* SEND OTP*/
const send = async (req, res, next) => {
  try {
    const { phone } = req.parsed.data;

    const isBanned = await Ban.findOne({ phone });
    if (isBanned) {
      return next(new AppError(403, "User is banned"));
    }

    const { expired, remainingTime } = await getOtpDetails(phone);

    if (!expired) {
      return next(
        new AppError(429, `Try again after ${remainingTime}`, {
          details: { remainingTime },
        })
      );
    }

    const code = crypto.randomInt(10000, 99999);
    if (process.env.NODE_ENV !== "production") {
      logger.debug("[DEV OTP]", code);
    }    
    
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
      return next(new AppError(500, "SMS service failed"));
    }

    const hashedOtp = await hash(
      String(code),
      10
    );

    await redisClient.set(
      getOtpKey(phone),
      hashedOtp,
      { EX: OTP_TTL_SECONDS }
    );

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: { remainingTime: formatRemainingTime(OTP_TTL_SECONDS) },
    });
  } catch (err) {
    next(err);
  }
};

/*  VERIFY OTP → LOGIN (creates a new session for this device) */
const verify = async (req, res, next) => {
  try {
    const { phone, code } = req.parsed.data;
    const savedOtp = await redisClient.get(getOtpKey(phone));

    if (!savedOtp) {
      return next(new AppError(410, "OTP expired"));
    }

    const isValid = await compare(code, savedOtp);
    if (!isValid) {
      return next(new AppError(410, "Invalid OTP"));
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

    const { accessToken, refreshToken } = await sessionService.createSession(user, req);
    setAuthCookies(res, { accessToken, refreshToken });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: user.toObject() },
    });
  } catch (err) {
    next(err);
  }
};

/* LOGOUT (this device only)
   Works with just the refresh cookie, so an expired access token can still log out. */
const logout = async (req, res, next) => {
  try {
    let sid = req.sessionId || null;
    if (!sid && req.cookies?.refreshToken) {
      const payload = await verifyRefreshToken(req.cookies.refreshToken);
      sid = payload?.sid || null;
    }

    if (sid) await sessionService.revokeSession(sid, "logout");

    clearAuthCookies(res);
    res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

/* REFRESH TOKEN (rotation + reuse detection) */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return next(new AppError(401, "Unauthorized"));
    }

    const result = await sessionService.rotateSession(refreshToken, req);

    if (!result.ok) {
      clearAuthCookies(res);
      return next(new AppError(401, "Session invalid"));
    }

    // refreshToken is null in the multi-tab grace case → keep the browser's current cookie
    setAuthCookies(res, result);

    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (err) {
    logger.error("refresh error:", err);
    next(err);
  }
};

module.exports = {
  send,
  verify,
  logout,
  refreshToken,
};
