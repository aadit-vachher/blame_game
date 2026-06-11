const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware to check express-validator results
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));
    return next(new ValidationError('Validation failed', formatted));
  }
  next();
}

module.exports = { validate };
