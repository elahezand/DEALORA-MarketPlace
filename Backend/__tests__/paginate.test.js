/* the cursor must not replace a filter on the same field */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const stubs = {
  mongoose: { Types: { ObjectId: Object.assign(class {}, { isValid: () => true }) } },
  [path.resolve(__dirname, "../models/listing.js")]: {},
  [path.resolve(__dirname, "../models/category.js")]: {},
  [path.resolve(__dirname, "../models/offerSeller.js")]: {},
  [path.resolve(__dirname, "../models/coupon.js")]: {},
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (stubs[request]) return stubs[request];
  try {
    const r = Module._resolveFilename(request, parent, isMain);
    if (stubs[r]) return stubs[r];
  } catch (_) {}
  return origLoad.apply(this, arguments);
};
const { paginate } = require("../utils/helper");

let lastQuery = null;
const Model = {
  find(q) {
    lastQuery = q;
    const chain = { sort: () => chain, limit: () => chain, lean: () => chain, populate: () => chain, select: () => chain,
      then: (r) => r([]) };
    return chain;
  },
};

test("page 2 keeps the date range", async () => {
  const from = new Date("2026-09-01");
  await paginate(Model, { filters: { createdAt: { $gte: from } }, cursor: "2026-09-20T00:00:00.000Z" });
  assert.deepEqual(lastQuery.createdAt, { $gte: from });              // range still there
  assert.deepEqual(lastQuery.$and, [{ createdAt: { $lt: "2026-09-20T00:00:00.000Z" } }]);
});

test("existing $and conditions are kept too", async () => {
  await paginate(Model, { filters: { $and: [{ a: 1 }] }, cursor: "x", sort: { _id: -1 } });
  assert.deepEqual(lastQuery.$and, [{ a: 1 }, { _id: { $lt: "x" } }]);
});
