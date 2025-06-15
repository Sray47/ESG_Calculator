// errorMiddleware.js
const sanitizeError = (error, environment = 'production') => {
  // Define sensitive keywords that should not be exposed
  const sensitiveKeywords = [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'database', 'connection', 'pool', 'query', 'sql', 'postgres',
    'supabase', 'admin', 'internal', 'system', 'server', 'config'
  ];

  // Check if error message contains sensitive information
  const containsSensitiveInfo = (message) => {
    const lowerMessage = message.toLowerCase();
    return sensitiveKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Sanitize error message
  const sanitizeMessage = (message) => {
    if (environment === 'development') {
      return message; // Show full errors in development
    }
    
    if (containsSensitiveInfo(message)) {
      return 'An internal server error occurred. Please try again later.';
    }
    
    // Allow common user-friendly error messages
    const allowedErrors = [
      'validation failed',
      'not found',
      'access denied',
      'unauthorized',
      'invalid input',
      'missing required field',
      'already exists',
      'invalid format'
    ];
    
    const lowerMessage = message.toLowerCase();
    const isAllowed = allowedErrors.some(allowed => lowerMessage.includes(allowed));
    
    return isAllowed ? message : 'An error occurred while processing your request.';
  };

  return {
    message: sanitizeMessage(error.message || 'Unknown error'),
    ...(environment === 'development' && { 
      stack: error.stack,
      originalMessage: error.message 
    })
  };
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error caught by error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  const environment = process.env.NODE_ENV || 'production';
  const sanitizedError = sanitizeError(err, environment);

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError' || err.message.includes('unauthorized')) {
    statusCode = 401;
  } else if (err.name === 'ForbiddenError' || err.message.includes('access denied')) {
    statusCode = 403;
  } else if (err.name === 'NotFoundError' || err.message.includes('not found')) {
    statusCode = 404;
  } else if (err.name === 'ConflictError' || err.message.includes('already exists')) {
    statusCode = 409;
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503; // Service Unavailable
    sanitizedError.message = 'Service temporarily unavailable. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    error: sanitizedError,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown' // If you add request ID middleware
  });
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found'
    },
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  sanitizeError
};
