const UserModel = require("../models/user");
const BanModel = require("../models/ban");
const { verifyToken } = require("../utils/auth");
const { isSessionRevoked } = require("../services/shared/session");

const getToken = (req) => {
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
};

const authUser = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const payload = await verifyToken(token);
    
    if (!payload?.id || !payload?.sid) {
      return res.status(401).json({ status: "expired" });
    }

    if (await isSessionRevoked(payload.sid)) {
      return res.status(401).json({ status: "session_revoked" });
    }

    const user = await UserModel.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isBanUser = await BanModel.exists({ phone: user.phone });
    if (isBanUser) {
      return res.status(403).json({ message: "Access denied" });
    }
    req.user = user;
    req.sessionId = payload.sid;
    next();
  } catch (err) {
    next(err);
  }
};
const optionalAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    const payload = token ? await verifyToken(token) : null;
    if (payload?.sid) req.sessionId = payload.sid;
  } catch (_) {
  }
  next();
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    const userRoles = Array.isArray(req.user.role) ? req.user.role : [req.user.role];

    const hasAccess = userRoles.some((userRole) =>
      roles.some(
        (allowedRole) =>
          String(userRole).toUpperCase() === String(allowedRole).toUpperCase()
      )
    );

    if (!hasAccess)
      return res.status(403).json({ message: "Access denied" });
    next();
  };
};

const authSeller = allowRoles("SELLER");
const authAdmin = allowRoles("ADMIN");

module.exports = {
  authUser,
  optionalAuth,
  authAdmin,
  authSeller,
  allowRoles,
};