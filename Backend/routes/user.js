const express = require("express");
const userRouter = express.Router();

const {
  createAddress,
  putUser,
  removeAddress,
  updatedAddress,
} = require("../controllers/user/user");
const {
  getAllUsers,
  postNewUser,
  removeUser,
  toggleRole,
  toggleBan,
  getAdmins,
} = require("../controllers/admin/user");

const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const upload = require("../utils/multer");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");
const {
  createUserSchema,
  updateMyProfileSchema,
  addressSchema,
} = require("../validators/user");

// --- Admin Operations ---
const { getMyWallet } = require("../controllers/user/wallet");

userRouter.get("/me/wallet", authUser, getMyWallet);

userRouter.get("/", authUser, authAdmin, getAllUsers);
userRouter.get("/admins", authUser, authAdmin, getAdmins);
userRouter.post("/", authUser, authAdmin, validate(createUserSchema), postNewUser);
userRouter.patch("/:id/role", authUser, authAdmin, validateObjectIdParam("id"), toggleRole);
userRouter.post("/:id/ban", authUser, authAdmin, validateObjectIdParam("id"), toggleBan);
userRouter.delete("/:id", authUser, authAdmin, validateObjectIdParam("id"), removeUser);

// --- Current Authenticated User Operations ---
userRouter.put(
  "/me/profile",
  authUser,
  upload.single("avatar"),
  upload.verifyUploadedImages,
  validate(updateMyProfileSchema),
  putUser
);

// Address Management
userRouter.post("/me/addresses", authUser, validate(addressSchema), createAddress);

userRouter.patch(
  "/me/addresses/:addressId",
  authUser,
  validateObjectIdParam("addressId"),
  validate(addressSchema),
  updatedAddress
);

userRouter.delete(
  "/me/addresses/:addressId",
  authUser,
  validateObjectIdParam("addressId"),
  removeAddress
);

module.exports = userRouter;