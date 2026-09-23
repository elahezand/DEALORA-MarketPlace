/* services/cart.js with in-memory fakes: the cart stores no prices, the view calculates them */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const LISTING_ID = "1".repeat(24);
const V128 = "a".repeat(24);
const OFFER_ID = "c".repeat(24);

const listing = {
  _id: LISTING_ID, listingType: "store_product", status: "active", title: "iPhone 15", images: ["/x.jpg"],
  variants: [{ _id: V128, sku: "128", attributes: { storage: "128GB" }, price: 50, discount: 10, finalPrice: 45, stock: 5 }],
};
const offer = {
  _id: OFFER_ID, status: "accepted", stock: 10, productId: listing, store: { _id: "s1", name: "Ali Store" },
  variantId: V128, price: 48, discount: 5, finalPrice: 45.6, shipsWithinDays: 2,
};

let savedCart = null;
class FakeCart {
  constructor(d) { Object.assign(this, { items: [], coupon: null, shippingCost: 0, status: "active" }, d); }
  async save() { savedCart = JSON.parse(JSON.stringify(this.items)); return this; }
  toJSON() { return { id: "cart1", user: this.user, status: this.status }; }
  static async findOne() { return FakeCart.current; }
  static async findOneAndUpdate(q, u) {
    if (!FakeCart.current) FakeCart.current = new FakeCart(u.$setOnInsert);
    return FakeCart.current;
  }
}

const chain = (value) => ({ populate() { return this; }, then: (r) => r(value) });
const stubs = {
  mongoose: { Types: { ObjectId: { isValid: () => true } } },
  [path.resolve(__dirname, "../models/offerSeller.js")]: { find: () => chain([offer]) },
  [path.resolve(__dirname, "../models/listing.js")]: { find: async () => [listing] },
  [path.resolve(__dirname, "../models/category.js")]: {},
  [path.resolve(__dirname, "../models/cart.js")]: FakeCart,
  [path.resolve(__dirname, "../models/coupon.js")]: { findById: async () => null, findOne: async () => null },
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

const cartService = require("../services/user/cart");

test("addToCart stores only productId / variantId / offer / quantity", async () => {
  FakeCart.current = null;
  await cartService.addToCart("u1", [{ productId: LISTING_ID, variantId: V128, offer: OFFER_ID, quantity: 1 }]);
  assert.deepEqual(Object.keys(savedCart[0]).sort(), ["offer", "productId", "quantity", "variantId"]);
});

test("reading the cart returns the CURRENT prices from the offer", async () => {
  offer.price = 60; offer.discount = 0; offer.finalPrice = 60;   // seller changed the price
  const view = await cartService.getUserCart("u1");
  assert.equal(view.items[0].finalPrice, 60);
  assert.equal(view.items[0].offer.store.name, "Ali Store");
  assert.equal(view.items[0].productId.title, "iPhone 15");
  assert.equal(view.pricing.total, 60);
});

test("items that became unavailable are removed from the cart and reported", async () => {
  offer.status = "rejected";
  const view = await cartService.getUserCart("u1");
  assert.equal(view.items.length, 0);
  assert.equal(view.removedItems[0].reason, "offer_not_accepted");
  assert.equal(savedCart.length, 0);
});
