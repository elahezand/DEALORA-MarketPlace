const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calcFinalPrice, variantFinalPrice, computeMinPrice } = require("../utils/pricing");

test("calcFinalPrice applies a percent discount and clamps it to 0-100", () => {
  assert.equal(calcFinalPrice(1000, 15), 850);
  assert.equal(calcFinalPrice(100), 100);
  assert.equal(calcFinalPrice(100, 150), 0);
  assert.equal(calcFinalPrice(100, -5), 100);
});

test("variantFinalPrice returns the stored finalPrice", () => {
  assert.equal(variantFinalPrice({ price: 200, discount: 50, finalPrice: 100 }), 100);
  assert.equal(variantFinalPrice(null), null);
});

test("computeMinPrice: user_ad uses the listing price", () => {
  assert.equal(computeMinPrice({ listingType: "user_ad", price: 500 }), 500);
});

test("computeMinPrice: store_product ignores listing price, uses cheapest variant/offer", () => {
  const listing = {
    listingType: "store_product",
    price: 1,
    variants: [
      { price: 1000, discount: 10, finalPrice: 900 },
      { price: 800, discount: 0, finalPrice: 800 },
    ],
  };
  assert.equal(computeMinPrice(listing), 800);
  assert.equal(computeMinPrice(listing, [750]), 750);
});