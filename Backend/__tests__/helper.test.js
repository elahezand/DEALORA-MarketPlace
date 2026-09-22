const { test } = require("node:test");
const assert = require("node:assert/strict");
const { escapeRegex, buildListingFilters } = require("../utils/helper");

test("escapeRegex escapes regex special characters", () => {
  assert.equal(escapeRegex("a.b*c"), "a\\.b\\*c");
  assert.equal(escapeRegex("(test)"), "\\(test\\)");
  assert.equal(escapeRegex("plain text"), "plain\\ text");
});

test("buildListingFilters: no listingType/status -> defaults to the accepted-ad OR active-product condition", async () => {
  const filters = await buildListingFilters({});
  assert.ok(Array.isArray(filters.$and));
  assert.deepEqual(filters.$and[0].$or, [
    { listingType: "user_ad", status: "accepted" },
    { listingType: "store_product", status: "active" },
  ]);
});

test("buildListingFilters: explicit status overrides the default", async () => {
  const filters = await buildListingFilters({ status: "pending" });
  assert.equal(filters.status, "pending");
});

test("buildListingFilters: price range 'min-max' parses into $gte/$lte", async () => {
  const filters = await buildListingFilters({ price: "100-500" });
  assert.deepEqual(filters.minPrice, { $gte: 100, $lte: 500 });
});

test("buildListingFilters: single price value parses into an exact number", async () => {
  const filters = await buildListingFilters({ price: "250" });
  assert.equal(filters.minPrice, 250);
});

test("buildListingFilters: tags are split and trimmed into $in", async () => {
  const filters = await buildListingFilters({ tags: "new, sale" });
  assert.deepEqual(filters.tags.$in, ["new", "sale"]);
});

test("buildListingFilters: price 'min-' (max omitted) only sets $gte, never a bogus $lte:0 (regression test)", async () => {
  const filters = await buildListingFilters({ price: "100-" });
  assert.deepEqual(filters.minPrice, { $gte: 100 });
});

test("buildListingFilters: price '-max' (min omitted) only sets $lte", async () => {
  const filters = await buildListingFilters({ price: "-500" });
  assert.deepEqual(filters.minPrice, { $lte: 500 });
});

test("buildListingFilters: condition on a user_ad filters Listing.condition directly", async () => {
  const filters = await buildListingFilters({ listingType: "user_ad", condition: "used" });
  assert.equal(filters.condition, "used");
});

test("buildListingFilters: condition on a store_product also filters Listing.condition directly (a store lists one condition per catalog listing; sellers only offer price/stock against it)", async () => {
  const filters = await buildListingFilters({ listingType: "store_product", condition: "new" });
  assert.equal(filters.condition, "new");
});

test("buildListingFilters: an invalid condition value is ignored", async () => {
  const filters = await buildListingFilters({ listingType: "user_ad", condition: "refurbished" });
  assert.equal(filters.condition, undefined);
});

test("buildListingFilters: rating filters on metrics.score for store products (or when browsing both types)", async () => {
  const filters = await buildListingFilters({ rating: "4" });
  assert.deepEqual(filters["metrics.score"], { $gte: 4 });
});

test("buildListingFilters: rating is ignored for user_ad (classified ads have no review/rating concept)", async () => {
  const filters = await buildListingFilters({ listingType: "user_ad", rating: "4" });
  assert.equal(filters["metrics.score"], undefined);
});
