# ESG Calculator Security Implementation Guide

This document provides specific code implementations and fixes for the security vulnerabilities identified in the security assessment.

---

## 1. Critical Fix: Rate Limiting Implementation

### Install Required Package
```bash
npm install express-rate-limit
```

### Backend Implementation (server.js)
```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 authentication attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

---

## 2. Critical Fix: Secure Error Handling

### Backend Error Middleware (errorHandler.js)
```javascript
// Create new file: brsr_backend/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  // Log the full error for debugging (server-side only)
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Generic error responses for production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Determine error type and appropriate response
  let statusCode = err.statusCode || 500;
  let message = 'An error occurred';
  let errorCode = 'INTERNAL_ERROR';

  // Categorize known errors
  if (err.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
    errorCode = 'DUPLICATE_RESOURCE';
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    message = 'Resource not found';
    errorCode = 'NOT_FOUND';
  } else if (err.message.includes('unauthorized')) {
    statusCode = 401;
    message = 'Authentication required';
    errorCode = 'UNAUTHORIZED';
  } else if (err.message.includes('forbidden')) {
    statusCode = 403;
    message = 'Access denied';
    errorCode = 'FORBIDDEN';
  }

  // Response object
  const errorResponse = {
    error: message,
    code: errorCode,
    timestamp: new Date().toISOString()
  };

  // Add details only in development
  if (isDevelopment) {
    errorResponse.details = err.message;
    errorResponse.path = req.path;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
```

### Update Routes to Use Secure Error Handling
```javascript
// Example for authRoutes.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Replace try-catch blocks with asyncHandler
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Validation
  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  // Authentication logic...
  const result = await authenticateUser(email, password);
  
  if (!result.success) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  res.json({
    success: true,
    user: result.user,
    token: result.token
  });
}));
```

---

## 3. Security Headers Implementation

### Install Helmet
```bash
npm install helmet
```

### Security Headers Configuration (server.js)
```javascript
const helmet = require('helmet');

// Configure comprehensive security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.supabase.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // May cause issues with third-party resources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

---

## 4. Input Validation and Sanitization

### Install Validation Libraries
```bash
npm install joi validator express-validator
```

### Validation Middleware (validators.js)
```javascript
// Create new file: brsr_backend/middleware/validators.js

const Joi = require('joi');
const validator = require('validator');

// User registration validation schema
const userRegistrationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .custom((value, helpers) => {
      if (!validator.isEmail(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    }),
  firstName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),
  lastName: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),
  companyName: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-\.]+$/)
    .optional()
});

// Report data validation schema
const reportDataSchema = Joi.object({
  reportName: Joi.string()
    .min(3)
    .max(200)
    .pattern(/^[a-zA-Z0-9\s\-\_\.]+$/)
    .required(),
  reportType: Joi.string()
    .valid('annual', 'quarterly', 'monthly')
    .required(),
  data: Joi.object({
    environmental: Joi.object().optional(),
    social: Joi.object().optional(),
    governance: Joi.object().optional()
  }).required(),
  year: Joi.number()
    .integer()
    .min(2020)
    .max(new Date().getFullYear())
    .required()
});

// Validation middleware function
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove HTML tags and encode special characters
    return validator.escape(validator.stripLow(str.trim()));
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  req.body = sanitizeObject(req.body);
  next();
};

module.exports = {
  validateInput,
  sanitizeInput,
  userRegistrationSchema,
  reportDataSchema
};
```

### Apply Validation to Routes
```javascript
// Update authRoutes.js
const { validateInput, sanitizeInput, userRegistrationSchema } = require('./middleware/validators');

router.post('/register', 
  sanitizeInput,
  validateInput(userRegistrationSchema),
  asyncHandler(async (req, res) => {
    // Registration logic with validated data
    const { email, password, firstName, lastName, companyName } = req.body;
    
    // Continue with registration...
  })
);
```

---

## 5. Enhanced CORS Configuration

### Secure CORS Setup (server.js)
```javascript
// Whitelist of allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Development
  'https://yourdomain.com', // Production
  'https://www.yourdomain.com' // Production with www
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key'
  ],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
```

---

## 6. Enhanced Session Security

### Frontend Session Management (authService.js)
```javascript
// Enhanced token storage with security measures
class SecureTokenStorage {
  constructor() {
    this.tokenKey = 'esg_auth_token';
    this.refreshKey = 'esg_refresh_token';
    this.expiryKey = 'esg_token_expiry';
  }

  setToken(token, refreshToken, expiresIn) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    
    try {
      // Store with encryption if available
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.refreshKey, refreshToken);
      localStorage.setItem(this.expiryKey, expiryTime.toString());
      
      // Set up automatic token refresh
      this.scheduleTokenRefresh(expiresIn);
    } catch (error) {
      console.error('Failed to store authentication tokens:', error);
    }
  }

  getToken() {
    try {
      const token = localStorage.getItem(this.tokenKey);
      const expiry = localStorage.getItem(this.expiryKey);
      
      if (!token || !expiry) return null;
      
      // Check if token is expired
      if (Date.now() > parseInt(expiry)) {
        this.clearTokens();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Failed to retrieve authentication token:', error);
      return null;
    }
  }

  clearTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.expiryKey);
  }

  scheduleTokenRefresh(expiresIn) {
    // Refresh token 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;
    
    if (refreshTime > 0) {
      setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (!refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setToken(data.token, data.refreshToken, data.expiresIn);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return false;
  }
}

export const tokenStorage = new SecureTokenStorage();
```

---

## 7. Comprehensive Logging and Monitoring

### Install Logging Libraries
```bash
npm install winston express-winston
```

### Security Logging Configuration (logger.js)
```javascript
// Create new file: brsr_backend/config/logger.js

const winston = require('winston');
const expressWinston = require('express-winston');

// Security event logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'esg-calculator-security' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/security-events.log' 
    }),
  ],
});

// Express request logging middleware
const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ filename: 'logs/requests.log' })
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
});

// Security event tracking
const logSecurityEvent = (event, details, req = null) => {
  const logData = {
    event,
    details,
    timestamp: new Date().toISOString(),
    ...(req && {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method
    })
  };

  securityLogger.info('Security Event', logData);
};

module.exports = {
  securityLogger,
  requestLogger,
  logSecurityEvent
};
```

### Authentication Event Logging
```javascript
// Update authRoutes.js to include security logging
const { logSecurityEvent } = require('../config/logger');

router.post('/login', asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  try {
    const result = await authenticateUser(email, password);
    
    if (result.success) {
      logSecurityEvent('SUCCESSFUL_LOGIN', { email }, req);
      res.json({ success: true, user: result.user, token: result.token });
    } else {
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', { email, reason: 'invalid_credentials' }, req);
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }
  } catch (error) {
    logSecurityEvent('LOGIN_ERROR', { email, error: error.message }, req);
    throw error;
  }
}));
```

---

## 8. Implementation Checklist

### Immediate Actions (Week 1)
- [ ] Install and configure rate limiting
- [ ] Implement secure error handling
- [ ] Add input validation middleware
- [ ] Configure security headers with Helmet

### Security Hardening (Week 2)
- [ ] Enhance CORS configuration
- [ ] Implement comprehensive logging
- [ ] Add session security improvements
- [ ] Configure CSP headers

### Monitoring and Compliance (Week 3)
- [ ] Set up security event monitoring
- [ ] Implement automated security testing
- [ ] Configure log rotation and retention
- [ ] Document security procedures

### Testing and Validation (Week 4)
- [ ] Conduct security testing of implemented fixes
- [ ] Perform penetration testing
- [ ] Validate compliance with security standards
- [ ] Create incident response procedures

---

## 9. Environment Configuration

### Production Environment Variables
```bash
# Security Configuration
NODE_ENV=production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Session Security
SESSION_TIMEOUT=3600
TOKEN_REFRESH_THRESHOLD=300

# Logging
LOG_LEVEL=info
SECURITY_LOG_RETENTION_DAYS=90
```

### Development vs Production Configuration
```javascript
// config/security.js
const isDevelopment = process.env.NODE_ENV === 'development';

module.exports = {
  rateLimit: {
    windowMs: isDevelopment ? 60000 : 900000, // 1 min dev, 15 min prod
    max: isDevelopment ? 1000 : 100
  },
  cors: {
    origin: isDevelopment 
      ? ['http://localhost:5173', 'http://localhost:3000']
      : process.env.ALLOWED_ORIGINS?.split(',') || []
  },
  logging: {
    level: isDevelopment ? 'debug' : 'info',
    includeStack: isDevelopment
  }
};
```

This implementation guide provides the specific code and configurations needed to address all identified security vulnerabilities. Each section includes detailed implementation steps and can be applied incrementally to improve the application's security posture.
