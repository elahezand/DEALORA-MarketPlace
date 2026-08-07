const express = require("express");
const userRouter = express.Router();

const {
  getAllUsers,
  createAddress,
  postNewUser,
  putUser,
  removeUser,
  toggleRole,
  toggleBan,
  removeAddress,
  updatedAddress,
} = require("../controllers/user");

const { authAdmin, authUser } = require("../middlewares/authMiddleware");
const upload = require("../utils/multer");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");
const {
  createUserSchema,
  updateUserSchema,
  addressSchema,
} = require("../validators/user");

// --- Admin Operations ---
userRouter.get("/", authUser, authAdmin, getAllUsers);
userRouter.post("/", authUser, authAdmin, validate(createUserSchema), postNewUser);
userRouter.patch("/:id/role", authUser, authAdmin, validateObjectIdParam("id"), toggleRole);
userRouter.post("/:id/ban", authUser, authAdmin, validateObjectIdParam("id"), toggleBan);
userRouter.delete("/:id", authUser, authAdmin, validateObjectIdParam("id"), removeUser);

// --- Current Authenticated User Operations ---
userRouter.put(
  "/me/profile",
  authUser,
  upload.single("avatar"),
  validate(updateUserSchema),
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