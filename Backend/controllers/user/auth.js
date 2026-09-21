const AppError = require("../../utils/AppError");
const Session = require("../../models/session");
const sessionService = require("../../services/shared/session");
const { clearAuthCookies } = require("../shared/auth");

const me = async (req, res) => {
  const user = await req.user.populate("store");
  return res.status(200).json({ success: true, data: { user: user.toObject() } });
};

const logoutOthers = async (req, res, next) => {
  try {
    const count = await sessionService.revokeAllUserSessions(req.user._id, "logout_all", {
      exceptSessionId: req.sessionId,
    });
    res.status(200).json({
      success: true,
      message: `Logged out from ${count} other device(s)`,
      data: { revoked: count },
    });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.listActiveSessions(req.user._id, req.sessionId);
    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id,
      revokedAt: null,
    }).select("_id");

    if (!session) return next(new AppError(404, "Session not found"));

    await sessionService.revokeSession(session._id, "revoked_by_user");

    const isCurrent = String(session._id) === String(req.sessionId);
    if (isCurrent) clearAuthCookies(res);

    res.status(200).json({ success: true, message: "Session revoked", data: { isCurrent } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  me,
  getSessions,
  logoutOthers,
  revokeSession,
};
