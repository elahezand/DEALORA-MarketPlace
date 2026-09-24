const User = require("../../models/user");
const Session = require("../../models/session");
const Order = require("../../models/order");
const { paginate } = require("../../utils/helper");
const { buildListQuery, listLimit } = require("../../utils/listQuery");

/** "Chrome on Windows" out of a raw user-agent string */
const describeDevice = (userAgent = "") => {
  const browser =
    /Edg\//.test(userAgent) ? "Edge" :
    /OPR\/|Opera/.test(userAgent) ? "Opera" :
    /Firefox\//.test(userAgent) ? "Firefox" :
    /Chrome\//.test(userAgent) ? "Chrome" :
    /Safari\//.test(userAgent) ? "Safari" : null;

  const os =
    /Windows/.test(userAgent) ? "Windows" :
    /Android/.test(userAgent) ? "Android" :
    /iPhone|iPad|iOS/.test(userAgent) ? "iOS" :
    /Mac OS X|Macintosh/.test(userAgent) ? "macOS" :
    /Linux/.test(userAgent) ? "Linux" : null;

  if (!browser && !os) return null;
  return [browser, os].filter(Boolean).join(" on ");
};

/*
 * Users for the admin table: joined date, last login (newest session),
 * the device used and how many orders they placed.
 */
const getAllUsers = async (query = {}) => {
  const filters = buildListQuery(query, {
    search: ["name", "username", "phone", "email"],
  });
  if (query.role && query.role !== "all") filters.role = query.role;

  const result = await paginate(User, {
    limit: listLimit(query, 20, 50),
    cursor: query.cursor,
    filters,
    select: "-password -refreshToken",
    sort: { _id: -1 },
  });

  const userIds = result.data.map((u) => u._id);
  if (!userIds.length) return result;

  const [sessions, orderCounts] = await Promise.all([
    Session.find({ user: { $in: userIds } })
      .select("user userAgent ip lastUsedAt createdAt revokedAt")
      .sort({ lastUsedAt: -1 })
      .lean(),
    Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
    ]),
  ]);

  const lastSession = {};
  for (const s of sessions) {
    const key = String(s.user);
    if (!lastSession[key]) lastSession[key] = s; // list is sorted, first hit is the newest
  }
  const orders = orderCounts.reduce((acc, o) => ({ ...acc, [String(o._id)]: o.count }), {});

  const data = result.data.map((user) => {
    const session = lastSession[String(user._id)];
    return {
      ...user,
      joinedAt: user.createdAt,
      lastLoginAt: session?.lastUsedAt || null,
      lastDevice: session ? describeDevice(session.userAgent) : null,
      lastIp: session?.ip || null,
      activeSessions: sessions.filter((s) => String(s.user) === String(user._id) && !s.revokedAt).length,
      ordersCount: orders[String(user._id)] || 0,
    };
  });

  return { data, pagination: result.pagination };
};

module.exports = {
  getAllUsers,
  describeDevice,
};
