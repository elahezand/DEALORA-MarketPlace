const express = require("express");
const router = express.Router();
const { authUser } = require("../middlewares/authMiddleware");
const { getMyWallet } = require("../controllers/user/wallet");

router.get("/me", authUser, getMyWallet);

module.exports = router;
