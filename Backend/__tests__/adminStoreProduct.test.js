const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

let created = null;
let offersExist = null;
const PRODUCT_ID = "1".repeat(24);
const V1 = "a".repeat(24);
const V2 = "b".repeat(24);

const product = {
  _id: PRODUCT_ID,
  listingType: "store_product",
  status: "draft",
  images: ["/listings/images/old.jpg"],
  variants: [{ _id: V1 }, { _id: V2 }],
  save: async () => {},
};

const stubs = {
  mongoose: { Types: { ObjectId: { isValid: (v) => /^[0-9a-f]{24}$/.test(String(v)) } } },
  [path.resolve(__dirname, "../models/listing.js")]: {
    create: async (d) => (created = d),
    findById: async () => product,
  },
  [path.resolve(__dirname, "../models/offerSeller.js")]: { exists: async () => offersExist },
  [path.resolve(__dirname, "../models/category.js")]: {},
  [path.resolve(__dirname, "../utils/cache.js")]: async () => {},
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

const admin = require("../services/admin/listing");

test("create: keeps the chosen status and merges image urls with uploads", async () => {
  await admin.createStoreProduct(
    { title: "X", status: "active", images: ["https://img/a.png"], owner: "hacker" },
    [{ filename: "new.png" }]
  );
  assert.equal(created.status, "active");
  assert.equal(created.listingType, "store_product");
  assert.equal(created.owner, undefined);
  assert.deepEqual(created.images, ["https://img/a.png", "/listings/images/new.png"]);
});

test("create: an invalid status falls back to draft", async () => {
  await admin.createStoreProduct({ title: "X", status: "accepted" });
  assert.equal(created.status, "draft");
});

test("update: kept images + new uploads, status applied", async () => {
  offersExist = null;
  await admin.updateListing(
    PRODUCT_ID,
    { status: "inactive", images: [], variants: [{ _id: V1 }, { _id: V2 }] },
    [{ filename: "n.png" }]
  );
  assert.equal(product.status, "inactive");
  assert.deepEqual(product.images, ["/listings/images/n.png"]);
});

test("update: removing a variant that still has offers is refused", async () => {
  product.variants = [{ _id: V1 }, { _id: V2 }];
  offersExist = { _id: "offer" };
  await assert.rejects(
    () => admin.updateListing(PRODUCT_ID, { variants: [{ _id: V1 }] }),
    /still has seller offers/
  );
});

test("update: removing a variant without offers is allowed", async () => {
  product.variants = [{ _id: V1 }, { _id: V2 }];
  offersExist = null;
  await admin.updateListing(PRODUCT_ID, { variants: [{ _id: V1 }] });
  assert.deepEqual(product.variants, [{ _id: V1 }]);
});
