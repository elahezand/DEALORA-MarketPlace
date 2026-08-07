const Contact = require("../models/contact");
const sendEmail = require("../utils/sendEmail");
const paginate = require("../utils/helper");

async function getContacts(query = {}) {
  const limit = Math.min(Number(query.limit) || 15, 100);

  return paginate(Contact, { ...query, limit }, {}, null);
}

async function getContactById(id) {
  const contact = await Contact.findById(id);
  if (!contact) throw { status: 404, message: "Contact not found" };
  return contact;
}

async function createContact(data) {
  return Contact.create(data);
}

/* answer */
async function answerContact(id, adminId, content) {
  const contact = await Contact.findById(id);

  if (!contact) throw { status: 404, message: "Contact not found" };

  if (contact.status === "answered") {
    throw { status: 400, message: "Already answered" };
  }

  contact.status = "answered";
  contact.answer = content;
  contact.answeredBy = adminId;
  contact.answeredAt = new Date();

  await contact.save();


  setImmediate(() => {
    sendEmail(
      contact.email,
      `Dear ${contact.name}`,
      `<p>${content}</p>`
    ).catch(() => {});
  });

  return contact;
}

async function deleteContact(id) {
  const deleted = await Contact.findByIdAndDelete(id);
  if (!deleted) throw { status: 404, message: "Contact not found" };
  return true;
}

module.exports = {
  getContacts,
  getContactById,
  createContact,
  answerContact,
  deleteContact,
};