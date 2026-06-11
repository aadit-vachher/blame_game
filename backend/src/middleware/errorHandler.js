const { AppError } = require('../utils/errors');

/**
 * Central error handling middleware
 */
function errorHandler(err, req, res, _next) {
  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', err);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      code: 'CONFLICT',
      message: `A record with this ${field} already exists`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: 'Record not found',
    });
  }

  // Handle operational errors
  if (err instanceof AppError) {
    const response = {
      success: false,
      code: err.code,
      message: err.message,
    };
    if (err.errors) {
      response.errors = err.errors;
    }
    return res.status(err.statusCode).json(response);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
    });
  }

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      code: 'FILE_TOO_LARGE',
      message: 'File size exceeds the maximum limit',
    });
  }

  // Unknown errors
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
}

module.exports = { errorHandler };
