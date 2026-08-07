const Info = require("../models/info");

/* GET */
async function getInfo() {
  return Info.findOne({ key: "main" }).lean();
}

/* CREATE (ONLY INIT) */
async function createInfo(data) {
  const exists = await Info.findOne({ key: "main" });

  if (exists) {
    throw { status: 409, message: "Info already exists" };
  }

  return Info.create({
    key: "main",
    ...data,
  });
}

/* UPDATE (SAFE PATCH) */
async function updateInfo(data) {
  const allowedFields = [
    "phone",
    "email",
    "logo",
    "address",
    "socials",
  ];

  const update = {};

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      update[key] = data[key];
    }
  }

  return Info.findOneAndUpdate(
    { key: "main" },
    { $set: update },
    {
      new: true,
      runValidators: true,
      upsert: true,
    }
  );
}

/* DELETE */
async function deleteInfo() {
  throw {
    status: 403,
    message: "Deleting singleton config is not allowed",
  };
}

module.exports = {
  getInfo,
  createInfo,
  updateInfo,
  deleteInfo,
};