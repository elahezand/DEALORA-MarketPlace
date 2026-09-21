/*
 * Unit tests for services/session.js with in-memory fakes (no MongoDB / Redis needed).
 */
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");
const crypto = require("node:crypto");

process.env.ACCESS_TOKEN = "test-access";
process.env.REFRESH_TOKEN = "test-refresh";

/* ---------- fakes ---------- */
const store = new Map();       // sessions by id
const redis = new Map();       // redis keys
let idCounter = 0;
const newId = () => (++idCounter).toString(16).padStart(24, "0");

class FakeSession {
  constructor(data) {
    Object.assign(this, { previousTokenHash: null, rotatedAt: null, revokedAt: null, revokedReason: null }, data);
    this._id = this._id || newId();
  }
  isActive() { return !this.revokedAt && this.expiresAt > new Date(); }
  async save() { store.set(String(this._id), this); return this; }
  static async findById(id) { return store.get(String(id)) || null; }
  static async updateOne(filter, update) {
    const s = store.get(String(filter._id));
    if (!s || (filter.revokedAt === null && s.revokedAt)) return { modifiedCount: 0 };
    Object.assign(s, update.$set);
    return { modifiedCount: 1 };
  }
}

const fakeMongoose = { Types: { ObjectId: { isValid: (v) => /^[0-9a-f]{24}$/.test(String(v)) } } };
const fakeRedis = {
  async set(k, v) { redis.set(k, v); },
  async exists(k) { return redis.has(k) ? 1 : 0; },
};
// minimal HS256-free JWT fake: payload in base64, "signature" = secret
const fakeJwt = {
  sign(payload, secret, opts = {}) {
    const now = Math.floor(Date.now() / 1000);
    const body = { ...payload, iat: now, exp: now + (opts.expiresIn || 60), jti: opts.jwtid };
    return Buffer.from(JSON.stringify(body)).toString("base64url") + "." + secret;
  },
  verify(token, secret) {
    const [body, sig] = String(token).split(".");
    if (sig !== secret) throw new Error("bad signature");
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    if (p.exp < Date.now() / 1000) throw new Error("expired");
    return p;
  },
};

const stubs = {
  mongoose: fakeMongoose,
  jsonwebtoken: fakeJwt,
  bcryptjs: { hash: async () => "", compare: async () => false },
  [path.resolve(__dirname, "../models/session.js")]: FakeSession,
  [path.resolve(__dirname, "../redis.js")]: fakeRedis,
  [path.resolve(__dirname, "../utils/logger.js")]: { warn() {}, error() {}, info() {}, debug() {} },
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (stubs[request]) return stubs[request];
  try {
    const resolved = Module._resolveFilename(request, parent, isMain);
    if (stubs[resolved]) return stubs[resolved];
  } catch (_) { /* not resolvable → maybe a stubbed package */ }
  return origLoad.apply(this, arguments);
};

const svc = require("../services/shared/session");
const fakeReq = { get: () => "test-agent", ip: "1.2.3.4" };
const user = { _id: "aaaaaaaaaaaaaaaaaaaaaaaa" };

beforeEach(() => { store.clear(); redis.clear(); });

test("login creates an active session and tokens carry the session id", async () => {
  const { session, accessToken, refreshToken } = await svc.createSession(user, fakeReq);
  assert.ok(session.isActive());
  assert.equal(fakeJwt.verify(accessToken, "test-access").sid, String(session._id));
  assert.equal(fakeJwt.verify(refreshToken, "test-refresh").sid, String(session._id));
  assert.equal(await svc.isSessionRevoked(String(session._id)), false);
});

test("refresh rotates the token; the old one only works inside the grace window", async () => {
  const { refreshToken: t1 } = await svc.createSession(user, fakeReq);
  const r1 = await svc.rotateSession(t1, fakeReq);
  assert.equal(r1.ok, true);
  assert.ok(r1.refreshToken && r1.refreshToken !== t1);

  // parallel tab, same old token, a moment later → ok, but no new refresh cookie
  const r2 = await svc.rotateSession(t1, fakeReq);
  assert.equal(r2.ok, true);
  assert.equal(r2.refreshToken, null);

  // the new token keeps working
  const r3 = await svc.rotateSession(r1.refreshToken, fakeReq);
  assert.equal(r3.ok, true);
});

test("reusing an old refresh token after the grace window revokes the session", async () => {
  const { session, refreshToken: t1 } = await svc.createSession(user, fakeReq);
  const r1 = await svc.rotateSession(t1, fakeReq);
  store.get(String(session._id)).rotatedAt = new Date(Date.now() - 60_000); // grace passed

  const stolen = await svc.rotateSession(t1, fakeReq);
  assert.deepEqual(stolen, { ok: false, reason: "reuse_detected" });

  // even the legit newest token is dead now, and access tokens are blocked
  const legit = await svc.rotateSession(r1.refreshToken, fakeReq);
  assert.equal(legit.ok, false);
  assert.equal(await svc.isSessionRevoked(String(session._id)), true);
});

test("logout revokes only that session", async () => {
  const a = await svc.createSession(user, fakeReq);
  const b = await svc.createSession(user, fakeReq);
  await svc.revokeSession(String(a.session._id), "logout");
  assert.equal((await svc.rotateSession(a.refreshToken, fakeReq)).ok, false);
  assert.equal((await svc.rotateSession(b.refreshToken, fakeReq)).ok, true);
});

test("a refresh token with a wrong signature is rejected", async () => {
  const { refreshToken } = await svc.createSession(user, fakeReq);
  const forged = refreshToken.split(".")[0] + ".wrong-secret";
  assert.equal((await svc.rotateSession(forged, fakeReq)).ok, false);
});
