const express = require("express");
const router = express.Router();

const FavoriteController = require("../controllers/wishList");
const { authUser } = require("../middlewares/authMiddleware");

/* === PUBLIC === */
router.get("/popular", FavoriteController.getPopular);

/* === USER === */
router.get("/my", authUser, FavoriteController.getUserFavorites);
router.get("/count", authUser, FavoriteController.getFavoriteCount);
router.get("/check", authUser, FavoriteController.checkFavorites);
router.get("/type/:type", authUser, FavoriteController.filterByType);
router.get(
  "/is-favorited/:productId",
  authUser,
  FavoriteController.isFavorited
);

router.post("/", authUser, FavoriteController.addFavorite);
router.patch(
  "/:productId/toggle",
  authUser,
  FavoriteController.toggleFavorite
);
router.delete(
  "/:productId",
  authUser,
  FavoriteController.removeFavorite
);

module.exports = router;