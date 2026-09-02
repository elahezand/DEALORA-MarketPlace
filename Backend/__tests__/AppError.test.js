const { test } = require("node:test");
const assert = require("node:assert/strict");
const AppError = require("../utils/AppError");

test("AppError sets status and message", () => {
  const err = new AppError(404, "Not found");
  assert.equal(err.status, 404);
  assert.equal(err.message, "Not found");
});

test("AppError is a real Error instance (keeps stack trace, instanceof checks work)", () => {
  const err = new AppError(400, "Bad request");
  assert.ok(err instanceof Error);
  assert.ok(typeof err.stack === "string");
});

test("AppError defaults to 500 / Internal Server Error when called with no args", () => {
  const err = new AppError();
  assert.equal(err.status, 500);
  assert.equal(err.message, "Internal Server Error");
});

test("AppError marks itself as operational", () => {
  const err = new AppError(422, "Invalid data");
  assert.equal(err.isOperational, true);
});

test("AppError merges extra fields (e.g. validation errors, cart details)", () => {
  const err = new AppError(422, "Invalid data", { errors: [{ field: "phone" }] });
  assert.deepEqual(err.errors, [{ field: "phone" }]);

  const cartErr = new AppError(400, "Some items could not be added", {
    details: [{ reason: "out_of_stock" }],
  });
  assert.deepEqual(cartErr.details, [{ reason: "out_of_stock" }]);
});
