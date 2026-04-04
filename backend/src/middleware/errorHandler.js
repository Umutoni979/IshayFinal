const { ValidationError, UniqueConstraintError } = require('sequelize');

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error(`[${new Date().toISOString()}] ${err.statusCode || 500} ${err.message}`);
  }

  if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
