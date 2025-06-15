// validationMiddleware.js
const { body, param, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Sanitize error messages to avoid leaking sensitive information
    const sanitizedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: typeof error.value === 'string' && error.value.length > 50 
        ? error.value.substring(0, 50) + '...' 
        : error.value
    }));
    
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: sanitizedErrors 
    });
  }
  next();
};

// Validation rules for company profile creation
const validateCreateProfile = [
  body('auth_user_id')
    .isUUID()
    .withMessage('auth_user_id must be a valid UUID'),
  
  body('cin')
    .isLength({ min: 21, max: 21 })
    .withMessage('CIN must be exactly 21 characters')
    .matches(/^[LUF]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/)
    .withMessage('CIN must follow the valid format'),
  
  body('company_name')
    .isLength({ min: 1, max: 500 })
    .withMessage('Company name must be between 1 and 500 characters')
    .trim()
    .escape(),
  
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('year_of_incorporation')
    .optional()
    .isInt({ min: 1800, max: new Date().getFullYear() })
    .withMessage('Year of incorporation must be a valid year'),
  
  body('telephone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Must be a valid phone number'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Must be a valid URL'),
  
  body('paid_up_capital')
    .optional()
    .isNumeric()
    .withMessage('Paid up capital must be a number'),
  
  body('stock_exchange_listed')
    .optional()
    .isArray()
    .withMessage('Stock exchange listed must be an array'),
  
  handleValidationErrors
];

// Validation rules for report updates
const validateReportUpdate = [
  param('reportId')
    .isInt({ min: 1 })
    .withMessage('Report ID must be a positive integer'),
  
  body('financial_year')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Financial year must be in format YYYY-YYYY'),
  
  body('reporting_boundary')
    .optional()
    .isIn(['standalone', 'consolidated'])
    .withMessage('Reporting boundary must be either standalone or consolidated'),
  
  // Sanitize JSON fields
  body('sa_business_activities_turnover')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('sa_business_activities_turnover must be valid JSON');
        }
      }
      return true;
    }),
  
  body('sa_product_services_turnover')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('sa_product_services_turnover must be valid JSON');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation rules for section updates
const validateSectionUpdate = [
  param('reportId')
    .isInt({ min: 1 })
    .withMessage('Report ID must be a positive integer'),
  
  body('section')
    .isIn(['a', 'b', 'c'])
    .withMessage('Section must be a, b, or c'),
  
  // Validate that data is not excessively large
  body()
    .custom((value) => {
      const jsonString = JSON.stringify(value);
      if (jsonString.length > 1000000) { // 1MB limit
        throw new Error('Request payload is too large');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Validation for PDF generation
const validatePdfGeneration = [
  param('reportId')
    .isInt({ min: 1 })
    .withMessage('Report ID must be a positive integer'),
  
  handleValidationErrors
];

// General ID validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

// Report ID validation
const validateReportId = [
  param('reportId')
    .isInt({ min: 1 })
    .withMessage('Report ID must be a positive integer'),
  
  handleValidationErrors
];

// Validation for pagination parameters
const validatePagination = [
  body('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateProfile,
  validateReportUpdate,
  validateSectionUpdate,
  validatePdfGeneration,
  validateId,
  validateReportId,
  validatePagination,
  handleValidationErrors
};
