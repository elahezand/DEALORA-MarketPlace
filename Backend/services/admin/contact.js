const Contact = require("../../models/contact");
const sendEmail = require("../../utils/sendEmail");
const { paginate } = require("../../utils/helper");
const AppError = require("../../utils/AppError");
const { buildListQuery, listLimit, dateRangeFilter } = require("../../utils/listQuery");

async function getContacts(query = {}) {
  const limit = listLimit(query, 15);

  return paginate(Contact, {
    limit,
    cursor: query.cursor,
    filters: buildListQuery(query, {
      statuses: ["pending", "answered"],
      search: ["name", "email", "phone", "body"],
    }),
    sort: { _id: -1 }
  });
}

async function getContactById(id) {
  const contact = await Contact.findById(id);
  if (!contact) throw new AppError(404, "Contact not found");
  return contact;
}

/* answer */
async function answerContact(id, adminId, content) {
  const contact = await Contact.findById(id);

  if (!contact) throw new AppError(404, "Contact not found");

  if (contact.status === "answered") {
    throw new AppError(400, "Already answered");
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
    ).catch(() => { });
  });

  return contact;
}

async function deleteContact(id) {
  const deleted = await Contact.findByIdAndDelete(id);
  if (!deleted) throw new AppError(404, "Contact not found");
  return true;
}

module.exports = {
  getContacts,
  getContactById,
  answerContact,
  deleteContact,
};
