/* contact — PUBLIC — no login needed */
const Contact = require("../../models/contact");

async function createContact(data) {
  return Contact.create(data);
}

module.exports = {
  createContact,
};
