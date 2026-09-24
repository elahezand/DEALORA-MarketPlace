/* the shared filter every dashboard table uses */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === "mongoose") {
    return { Types: { ObjectId: Object.assign(function (v) { this.v = v; }, { isValid: (v) => /^[0-9a-f]{24}$/.test(String(v)) }) } };
  }
  return origLoad.call(this, request, ...rest);
};
const { buildListQuery, dateRangeFilter, listLimit } = require("../utils/listQuery");

test("from / to cover whole days", () => {
  const f = dateRangeFilter({ from: "2026-09-01", to: "2026-09-30" });
  assert.equal(f.createdAt.$gte.getHours(), 0);
  assert.equal(f.createdAt.$lte.getHours(), 23);
  assert.equal(f.createdAt.$lte.getDate(), 30);
});

test("presets turn into a start date", () => {
  const f = dateRangeFilter({ preset: "7d" });
  const days = (Date.now() - f.createdAt.$gte.getTime()) / 86400000;
  assert.ok(days >= 6 && days < 7.1);
  assert.deepEqual(dateRangeFilter({ preset: "all" }), {});
});

test("invalid dates are ignored instead of breaking the query", () => {
  assert.deepEqual(dateRangeFilter({ from: "not-a-date" }), {});
});

test("only allowed statuses pass; 'all' means no status filter", () => {
  const allowed = ["pending", "completed"];
  assert.equal(buildListQuery({ status: "pending" }, { statuses: allowed }).status, "pending");
  assert.equal(buildListQuery({ status: "hacked" }, { statuses: allowed }).status, undefined);
  assert.equal(buildListQuery({ status: "all" }, { statuses: allowed }).status, undefined);
});

test("search is escaped (no regex injection)", () => {
  const f = buildListQuery({ q: "a.*b" }, { search: ["title"] });
  assert.ok(f.title.test("a.*b"));
  assert.ok(!f.title.test("aXXb"));
});

test("base filters are always kept and ids must be valid", () => {
  const f = buildListQuery({ categoryId: "bad" }, { base: { user: "u1" }, ids: { categoryId: "categoryPath" } });
  assert.equal(f.user, "u1");
  assert.equal(f.categoryPath, undefined);
});

test("limit is clamped", () => {
  assert.equal(listLimit({ limit: "5000" }, 20, 100), 100);
  assert.equal(listLimit({}, 20), 20);
  assert.equal(listLimit({ limit: "-3" }, 20), 1);
});
