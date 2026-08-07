const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      expected: err.expected,
      received: err.received,
    }));

    return next({
      status: 422,
      message: "Invalid data",
      errors,
    });
  }

  req.parsed = parsed;
  next();
};

module.exports = validate;