const UserModel = require("../models/user");
const BanModel = require("../models/ban");
const { verifyToken } = require("../utils/auth");

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
    if (!payload) {
      return res.status(401).json({ status: "expired" });
    }
    const user = await UserModel.findOne({ phone: payload.phone })
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isBanUser = await BanModel.findOne({ phone: payload.phone });
    if (isBanUser) {
      return res.status(403).json({ message: "Access denied" });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
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
  authAdmin,
  authSeller,
  allowRoles,
};