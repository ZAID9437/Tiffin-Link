const crypto = require('crypto');

/**
 * Central Error Sanitization & Handling Middleware
 * Section 13 Specification:
 * - Generates unique correlation IDs (errorId)
 * - Returns structured { success: false, code, message, errorId }
 * - Completely prevents raw database internals, MongoDB queries, or backend stack traces from leaking to clients
 * - Safely logs technical diagnostics on the server
 */

const sanitizeServerError = (err) => {
  if (!err) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.'
    };
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return {
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested record could not be found.'
    };
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
    return {
      code: 'DUPLICATE_RECORD',
      message: 'A record with these details already exists. Please check your information.'
    };
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const firstKey = Object.keys(err.errors || {})[0];
    const validationMsg = firstKey && err.errors[firstKey]?.message
      ? err.errors[firstKey].message
      : 'Please check your inputs and ensure all required fields are filled correctly.';
    return {
      code: 'VALIDATION_ERROR',
      message: validationMsg
    };
  }

  // JSON Syntax Error (Malformed request payload)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return {
      code: 'INVALID_JSON_PAYLOAD',
      message: 'The provided request payload is invalid or malformed JSON.'
    };
  }

  const raw = String(err.message || '').toLowerCase();

  // Database connection or engine issues
  if (
    raw.includes('mongo') ||
    raw.includes('connect') ||
    raw.includes('econnrefused') ||
    raw.includes('topology') ||
    raw.includes('buffering timed out') ||
    raw.includes('database') ||
    raw.includes('replica')
  ) {
    return {
      code: 'SERVICE_UNAVAILABLE',
      message: 'Service is temporarily unable to reach the database. Please try again in a few moments.'
    };
  }

  // JavaScript runtime errors or internal code leaks
  if (
    raw.includes('syntaxerror') ||
    raw.includes('typeerror') ||
    raw.includes('referenceerror') ||
    raw.includes('collection') ||
    raw.includes('schema') ||
    raw.includes('objectid') ||
    raw.includes('bson') ||
    raw.includes('server error:')
  ) {
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to complete your request at this time. Please try again.'
    };
  }

  // Clean custom message
  return {
    code: err.code || 'REQUEST_FAILED',
    message: err.message || 'An unexpected error occurred. Please try again.'
  };
};

const errorHandler = (err, req, res, next) => {
  const errorId = `TL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  // Always log full diagnostic trace safely on the server with correlation ID
  console.error(`\x1b[31m[Server Error ${errorId}]\x1b[0m`, {
    path: req.originalUrl || req.url,
    method: req.method,
    ip: req.ip,
    message: err.message,
    stack: err.stack
  });

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);
  const { code, message } = sanitizeServerError(err);

  // Attach correlation ID to response headers for debugging
  res.setHeader('X-Error-Id', errorId);

  res.status(statusCode).json({
    success: false,
    code,
    message,
    errorId
  });
};

/**
 * 404 Handler for Unknown API Endpoints
 * Prevents Express default HTML response from leaking to API clients
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    code: 'API_ENDPOINT_NOT_FOUND',
    message: `The requested endpoint ${req.method} ${req.originalUrl || req.url} does not exist on this server.`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
  sanitizeServerError
};
