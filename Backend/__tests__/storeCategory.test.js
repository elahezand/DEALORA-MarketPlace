/* seller offers are limited to the store's top-level category */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const ELECTRONICS = "e".repeat(24);
const HOME = "h".repeat(24).replace(/h/g, "a");
const PRODUCT = "1".repeat(24);
const V1 = "2".repeat(24);

let store = { _id: "s1", category: ELECTRONICS };
let product = { _id: PRODUCT, listingType: "store_product", status: "active", variants: [{ _id: V1 }], categoryPath: [ELECTRONICS, "3".repeat(24)] };
let lastPaginate = null;

const lean = (v) => ({ select() { return this; }, lean: async () => v });
const stubs = {
  mongoose: { Types: { ObjectId: { isValid: (v) => /^[0-9a-f]{24}$/.test(String(v)) } } },
  [path.resolve(__dirname, "../models/store.js")]: { findOne: () => lean(store) },
  [path.resolve(__dirname, "../models/listing.js")]: { findById: () => lean(product) },
  [path.resolve(__dirname, "../models/offerSeller.js")]: { exists: async () => null, create: async (d) => d },
  [path.resolve(__dirname, "../models/category.js")]: {},
  [path.resolve(__dirname, "../utils/helper.js")]: {
    paginate: async (M, opts) => { lastPaginate = opts; return { data: [], pagination: {} }; },
    escapeRegex: (s) => s,
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

const service = require("../services/seller/offerSeller");

test("offerable products are filtered by the store's category", async () => {
  const res = await service.getOfferableProducts("u1", { q: "phone" });
  assert.equal(res.needsCategory, false);
  assert.equal(lastPaginate.filters.categoryPath, ELECTRONICS);
  assert.equal(lastPaginate.filters.status, "active");
});

test("a store without a category gets an empty list and needsCategory", async () => {
  store = { _id: "s1", category: null };
  const res = await service.getOfferableProducts("u1");
  assert.equal(res.needsCategory, true);
  assert.deepEqual(res.data, []);
  store = { _id: "s1", category: ELECTRONICS };
});

test("an offer on a product outside the store's category is refused", async () => {
  store = { _id: "s1", category: HOME };
  await assert.rejects(
    () => service.createOffer("u1", { productId: PRODUCT, variantId: V1, price: 10, stock: 1 }),
    /not in your store's category/
  );
  store = { _id: "s1", category: ELECTRONICS };
});

test("an offer inside the store's category is created", async () => {
  const offer = await service.createOffer("u1", { productId: PRODUCT, variantId: V1, price: 10, stock: 1 });
  assert.equal(offer.product, PRODUCT);
  assert.equal(offer.status, "pending");
});
