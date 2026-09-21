/* calculateCartTotals with in-memory fakes (no MongoDB needed) */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const LISTING_ID = "l".padEnd(24, "0").replace("l", "1");
const V128 = "a".repeat(24);
const V256 = "b".repeat(24);
const OFFER_ID = "c".repeat(24);

const listing = {
  _id: LISTING_ID,
  listingType: "store_product",
  status: "active",
  title: "iPhone 15",
  variants: [
    { _id: V128, sku: "128", attributes: { storage: "128GB" }, price: 50, discount: 10, finalPrice: 45, stock: 5 },
    { _id: V256, sku: "256", attributes: { storage: "256GB" }, price: 60, discount: 0, finalPrice: 60, stock: 3 },
  ],
};
const offer = {
  _id: OFFER_ID, status: "accepted", stock: 10, product: listing, store: "s1",
  variantId: V128, price: 48, discount: 5, finalPrice: 45.6,
};

const chain = (value) => ({ populate() { return this; }, then: (r) => r(value) });
const stubs = {
  mongoose: { Types: { ObjectId: { isValid: () => true } } },
  [path.resolve(__dirname, "../models/offerSeller.js")]: { find: () => chain([offer]) },
  [path.resolve(__dirname, "../models/listing.js")]: { find: async () => [listing] },
  [path.resolve(__dirname, "../models/category.js")]: {},
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

const { calculateCartTotals } = require("../utils/helper");

test("direct purchase: price / discount / finalPrice come from the variant", async () => {
  const res = await calculateCartTotals([{ product: LISTING_ID, variantId: V128, quantity: 2 }]);
  const [item] = res.items;
  assert.equal(item.price, 50);
  assert.equal(item.discount, 10);
  assert.equal(item.finalPrice, 45);
  assert.equal(res.pricing.subtotal, 90);
});

test("offer purchase: price / discount / finalPrice come from the offer", async () => {
  const res = await calculateCartTotals([{ offer: OFFER_ID, product: LISTING_ID, variantId: V128, quantity: 1 }]);
  const [item] = res.items;
  assert.equal(item.price, 48);
  assert.equal(item.discount, 5);
  assert.equal(item.finalPrice, 45.6);
  assert.equal(String(item.variantId), V128);
});

test("offer purchase with another variant id is rejected", async () => {
  const res = await calculateCartTotals([{ offer: OFFER_ID, product: LISTING_ID, variantId: V256, quantity: 1 }]);
  assert.equal(res.items.length, 0);
  assert.equal(res.skippedItems[0].reason, "variant_mismatch");
});

test("client-sent prices are ignored", async () => {
  const res = await calculateCartTotals([{ product: LISTING_ID, variantId: V256, quantity: 1, finalPrice: 1, price: 1 }]);
  assert.equal(res.items[0].finalPrice, 60);
});

test("coupon discount is applied on top of the final prices", async () => {
  const coupon = { isActive: true, type: "percent", amount: 10, maxDiscount: null };
  const res = await calculateCartTotals([{ product: LISTING_ID, variantId: V256, quantity: 1 }], coupon, 5);
  assert.equal(res.pricing.subtotal, 60);
  assert.equal(res.pricing.discount, 6);
  assert.equal(res.pricing.total, 59);
});
