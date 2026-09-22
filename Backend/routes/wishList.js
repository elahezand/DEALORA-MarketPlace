const express = require("express");
const router = express.Router();

const publicController = require("../controllers/public/wishList");
const userController = require("../controllers/user/wishList");
const { authUser } = require("../middlewares/authMiddleware");

/* === PUBLIC === */
router.get("/popular", publicController.getPopular);

/* === USER === */
router.get("/my", authUser, userController.getUserFavorites);
router.get("/count", authUser, userController.getFavoriteCount);
router.get("/check", authUser, userController.checkFavorites);
router.get("/type/:type", authUser, userController.filterByType);
router.get(
  "/is-favorited/:productId",
  authUser,
  userController.isFavorited
);

router.post("/", authUser, userController.addFavorite);
router.patch(
  "/:productId/toggle",
  authUser,
  userController.toggleFavorite
);
router.delete(
  "/:productId",
  authUser,
  userController.removeFavorite
);

module.exports = router;