/* services/listing.js with in-memory fakes */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

let created = null;
let offerFilter = null;
let statusUpdate = null;
const LISTING_ID = "1".repeat(24);
const listingDoc = { _id: LISTING_ID, listingType: "store_product", status: "active" };

const q = (value) => {
  const chain = {
    populate() { return chain; }, select() { return chain; }, sort() { return chain; }, limit() { return chain; },
    lean: async () => value,
    then: (r) => r(value),
  };
  return chain;
};

const stubs = {
  mongoose: { Types: { ObjectId: { isValid: (v) => /^[0-9a-f]{24}$/.test(String(v)) } } },
  [path.resolve(__dirname, "../models/listing.js")]: {
    create: async (d) => (created = d),
    updateOne: async () => ({}),
    findById: () => q(listingDoc),
    findByIdAndUpdate: async (id, u) => (statusUpdate = u),
    find: () => q([{ _id: LISTING_ID, title: "iPhone", minPrice: 45, categoryPath: [] }]),
  },
  [path.resolve(__dirname, "../models/offerSeller.js")]: { find: (f) => { offerFilter = f; return q([]); } },
  [path.resolve(__dirname, "../models/comment.js")]: {},
  [path.resolve(__dirname, "../models/category.js")]: {},
  [path.resolve(__dirname, "../utils/cache.js")]: async () => {},
  [path.resolve(__dirname, "../utils/helper.js")]: {
    paginate: async () => ({ data: [], pagination: {} }),
    buildListingFilters: async () => ({}),
  },
  [path.resolve(__dirname, "../utils/logger.js")]: { warn() {}, error() {} },
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

const publicService = require("../services/public/listing");
const userService = require("../services/user/listing");
const adminService = require("../services/admin/listing");

test("product page loads offers by `product` (not `listing`)", async () => {
  await publicService.getListingById(LISTING_ID);
  assert.equal(offerFilter.product, LISTING_ID);
  assert.equal(offerFilter.listing, undefined);
});

test("the user service refuses to create a store product", async () => {
  await assert.rejects(
    () => userService.createListing({ _id: "u1", role: ["USER"] }, { listingType: "store_product" }),
    /Only an admin/
  );
});

test("the admin service creates store products as draft", async () => {
  await adminService.createStoreProduct({ title: "iPhone", status: "active" });
  assert.equal(created.listingType, "store_product");
  assert.equal(created.status, "draft");
});

test("the client cannot set status / owner when creating a user ad", async () => {
  await userService.createListing({ _id: "u1", role: ["USER"] }, { listingType: "user_ad", status: "accepted", owner: "hacker" });
  assert.equal(created.status, "pending");
  assert.equal(created.owner, "u1");
});

test("a store product can't be set to a user-ad status", async () => {
  await assert.rejects(() => adminService.changeStatus(LISTING_ID, "accepted"), /Invalid status for store_product/);
  await adminService.changeStatus(LISTING_ID, "active");
  assert.deepEqual(statusUpdate, { status: "active" });
});

test("smart search ignores an id the AI made up", async () => {
  process.env.OPENROUTER_API_KEY = "x";
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: '{"_id":"ffffffffffffffffffffffff","reason":"r"}' } }] }),
  });
  const res = await publicService.smartSearch({ prompt: "phone" });
  assert.equal(res.data, null);
});

test("the public page hides listings that are not approved / active", async () => {
  listingDoc.status = "draft";
  await assert.rejects(() => publicService.getListingById(LISTING_ID), /Listing not found/);
  listingDoc.status = "active";
});

test("preview: admin can see a draft, a stranger can't", async () => {
  listingDoc.status = "draft";
  const res = await adminService.getListingPreview(LISTING_ID);
  assert.equal(res.preview, true);
  await assert.rejects(() => userService.getListingPreview(LISTING_ID, { _id: "u2", role: ["USER"] }), /not found/);
  listingDoc.status = "active";
});

test("an owner editing an approved ad sends it back to review", async () => {
  const ad = {
    _id: "2".repeat(24), listingType: "user_ad", status: "accepted", owner: "u1",
    save: async () => {},
  };
  const listingModel = stubs[path.resolve(__dirname, "../models/listing.js")];
  const originalFindById = listingModel.findById;
  listingModel.findById = async () => ad;
  const res = await userService.updateListing(ad._id, { _id: "u1", role: ["USER"] }, { title: "new title" });
  listingModel.findById = originalFindById;
  assert.equal(res.needsReview, true);
  assert.equal(ad.status, "pending");
  assert.equal(ad.title, "new title");
});
