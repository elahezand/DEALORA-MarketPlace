const { test } = require("node:test");
const assert = require("node:assert/strict");
const { hashToken, compareTokenHash } = require("../utils/auth");

// Two JWT-like tokens of the SAME user: identical first 72+ chars, different tail.
const prefix = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NWExYjJjM2Q0ZTVmNmE3YjhjOWQwZSIsInBob25lIjoiMDkxMjM0NTY3ODkiLCJ";
const oldToken = prefix + "pYXQiOjE3MDAwMDAwMDB9.aaaaaaaa";
const newToken = prefix + "pYXQiOjE3MDAwMDA5MDB9.bbbbbbbb";

test("current refresh token matches its stored hash", () => {
  assert.equal(compareTokenHash(newToken, hashToken(newToken)), true);
});

test("an OLD refresh token of the same user is rejected (bcrypt 72-byte bug)", () => {
  assert.equal(compareTokenHash(oldToken, hashToken(newToken)), false);
});

test("legacy bcrypt hashes / empty values never match", () => {
  assert.equal(compareTokenHash(newToken, "$2b$10$abcdefghijklmnopqrstuv"), false);
  assert.equal(compareTokenHash(newToken, null), false);
  assert.equal(compareTokenHash("", hashToken(newToken)), false);
});
