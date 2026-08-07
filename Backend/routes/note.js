const express = require("express");
const noteRouter = express.Router();

const controller = require("../controllers/note");
const { authUser } = require("../middlewares/authMiddleware");
const validateObjectIdParam = require("../middlewares/objectId");
const validate = require("../middlewares/validate");

const {
    createNoteSchema,
    updateNoteSchema,
} = require("../validators/note");

/*  GET ALL (USER NOTES) */
noteRouter.get(
    "/",
    authUser,
    controller.getAll
);

/*  GET ONE NOTE */
noteRouter.get(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    controller.getOne
);

/*  CREATE NOTE */
noteRouter.post(
    "/",
    authUser,
    validate(createNoteSchema),
    controller.postNote
);

/*  UPDATE NOTE (OWNER ONLY) */
noteRouter.put(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    validate(updateNoteSchema),
    controller.updateNote
);

/*  DELETE NOTE (OWNER ONLY) */
noteRouter.delete(
    "/:id",
    authUser,
    validateObjectIdParam("id"),
    controller.removeNote
);

module.exports = noteRouter;