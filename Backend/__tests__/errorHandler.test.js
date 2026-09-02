const { test } = require("node:test");
const assert = require("node:assert/strict");
const errorHandler = require("../middlewares/errorHandler");
const AppError = require("../utils/AppError");

// Minimal fake req/res to exercise the middleware without spinning up Express.
function makeRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

const fakeReq = { method: "GET", originalUrl: "/api/does-not-exist" };

test("errorHandler returns the AppError's own status code (regression test for the 404-returns-500 bug)", () => {
  const res = makeRes();
  errorHandler(new AppError(404, "Route not found"), fakeReq, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Route not found");
  assert.equal(res.body.success, false);
});

test("errorHandler falls back to 500 only when no status is present at all", () => {
  const res = makeRes();
  errorHandler(new Error("boom"), fakeReq, res, () => {});
  assert.equal(res.statusCode, 500);
});

test("errorHandler still honors legacy err.statusCode for any error not yet migrated to AppError", () => {
  const res = makeRes();
  const legacyErr = new Error("legacy");
  legacyErr.statusCode = 403;
  errorHandler(legacyErr, fakeReq, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("errorHandler surfaces extra fields like validation errors instead of dropping them", () => {
  const res = makeRes();
  errorHandler(
    new AppError(422, "Invalid data", { errors: [{ field: "phone", message: "Required" }] }),
    fakeReq,
    res,
    () => {}
  );
  assert.equal(res.statusCode, 422);
  assert.deepEqual(res.body.errors, [{ field: "phone", message: "Required" }]);
});
