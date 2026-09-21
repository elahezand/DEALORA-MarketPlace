/* info — PUBLIC — no login needed */
const Info = require("../../models/info");

/* GET */
async function getInfo() {
  return Info.findOne({ key: "main" }).lean();
}

module.exports = {
  getInfo,
};
