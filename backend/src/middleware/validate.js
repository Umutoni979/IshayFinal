const { error } = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
  const { error: validationError } = schema.validate(req.body, { abortEarly: false });
  if (validationError) {
    const messages = validationError.details.map((d) => d.message);
    return error(res, 'Validation failed', 400, messages);
  }
  next();
};

module.exports = validate;
