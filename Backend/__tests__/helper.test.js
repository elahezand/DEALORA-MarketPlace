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
  assert.deepEqual(filters.price, { $gte: 100, $lte: 500 });
});

test("buildListingFilters: single price value parses into an exact number", async () => {
  const filters = await buildListingFilters({ price: "250" });
  assert.equal(filters.price, 250);
});

test("buildListingFilters: tags are split and trimmed into $in", async () => {
  const filters = await buildListingFilters({ tags: "new, sale" });
  assert.deepEqual(filters.tags.$in, ["new", "sale"]);
});
