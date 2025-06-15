import { useFormStore } from '../store/formStore';

/**
 * Utility functions for form validation that integrate with the global store
 */

export const useFormValidation = () => {
  const { addValidationError, clearValidationErrors } = useFormStore();

  /**
   * Validates required fields for a section
   * @param {string} sectionId - The section identifier
   * @param {Object} data - The form data to validate
   * @param {Array} requiredFields - Array of required field names
   * @returns {boolean} - True if all required fields are filled
   */
  const validateRequiredFields = (sectionId, data, requiredFields) => {
    clearValidationErrors(sectionId);
    
    const errors = [];
    
    requiredFields.forEach(field => {
      const value = getNestedValue(data, field);
      if (!value || (Array.isArray(value) && value.length === 0)) {
        errors.push({
          field,
          message: `${formatFieldName(field)} is required`,
          section: sectionId
        });
      }
    });

    errors.forEach(error => addValidationError(error));
    
    return errors.length === 0;
  };

  /**
   * Validates email format
   * @param {string} sectionId - The section identifier
   * @param {string} email - The email to validate
   * @param {string} fieldName - The field name for error reporting
   * @returns {boolean} - True if email is valid
   */
  const validateEmail = (sectionId, email, fieldName = 'email') => {
    if (!email) return true; // Optional field validation
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    if (!isValid) {
      addValidationError({
        field: fieldName,
        message: 'Please enter a valid email address',
        section: sectionId
      });
    }
    
    return isValid;
  };

  /**
   * Validates phone number format
   * @param {string} sectionId - The section identifier
   * @param {string} phone - The phone number to validate
   * @param {string} fieldName - The field name for error reporting
   * @returns {boolean} - True if phone is valid
   */
  const validatePhone = (sectionId, phone, fieldName = 'phone') => {
    if (!phone) return true; // Optional field validation
    
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    const isValid = phoneRegex.test(phone) && phone.length >= 10;
    
    if (!isValid) {
      addValidationError({
        field: fieldName,
        message: 'Please enter a valid phone number',
        section: sectionId
      });
    }
    
    return isValid;
  };

  /**
   * Validates URL format
   * @param {string} sectionId - The section identifier
   * @param {string} url - The URL to validate
   * @param {string} fieldName - The field name for error reporting
   * @returns {boolean} - True if URL is valid
   */
  const validateUrl = (sectionId, url, fieldName = 'website') => {
    if (!url) return true; // Optional field validation
    
    try {
      new URL(url);
      return true;
    } catch {
      addValidationError({
        field: fieldName,
        message: 'Please enter a valid URL',
        section: sectionId
      });
      return false;
    }
  };

  /**
   * Validates percentage values (0-100)
   * @param {string} sectionId - The section identifier
   * @param {number} percentage - The percentage to validate
   * @param {string} fieldName - The field name for error reporting
   * @returns {boolean} - True if percentage is valid
   */
  const validatePercentage = (sectionId, percentage, fieldName) => {
    if (percentage === null || percentage === undefined || percentage === '') return true;
    
    const numValue = Number(percentage);
    const isValid = !isNaN(numValue) && numValue >= 0 && numValue <= 100;
    
    if (!isValid) {
      addValidationError({
        field: fieldName,
        message: 'Percentage must be between 0 and 100',
        section: sectionId
      });
    }
    
    return isValid;
  };

  /**
   * Validates that array has minimum number of items
   * @param {string} sectionId - The section identifier
   * @param {Array} array - The array to validate
   * @param {number} minItems - Minimum number of items required
   * @param {string} fieldName - The field name for error reporting
   * @returns {boolean} - True if array has enough items
   */
  const validateMinArrayItems = (sectionId, array, minItems, fieldName) => {
    const actualLength = Array.isArray(array) ? array.length : 0;
    const isValid = actualLength >= minItems;
    
    if (!isValid) {
      addValidationError({
        field: fieldName,
        message: `At least ${minItems} item${minItems === 1 ? '' : 's'} required`,
        section: sectionId
      });
    }
    
    return isValid;
  };

  return {
    validateRequiredFields,
    validateEmail,
    validatePhone,
    validateUrl,
    validatePercentage,
    validateMinArrayItems,
    clearValidationErrors: (sectionId) => clearValidationErrors(sectionId)
  };
};

/**
 * Helper function to get nested object values by dot notation
 * @param {Object} obj - The object to search
 * @param {string} path - Dot notation path (e.g., 'user.profile.name')
 * @returns {any} - The value at the path or undefined
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

/**
 * Helper function to format field names for error messages
 * @param {string} fieldName - The field name to format
 * @returns {string} - Formatted field name
 */
const formatFieldName = (fieldName) => {
  return fieldName
    .split('.')
    .pop()
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase());
};

/**
 * Section-specific validation rules
 */
export const SECTION_VALIDATION_RULES = {
  'section-a': {
    required: [
      'company_name',
      'cin',
      'year_of_incorporation',
      'registered_office_address',
      'corporate_address',
      'email',
      'telephone',
      'brsr_contact_name',
      'brsr_contact_mail',
      'brsr_contact_number',
      'sa_business_activities_turnover',
      'sa_product_services_turnover'
    ],
    optional: [
      'website',
      'paid_up_capital',
      'stock_exchange_listed'
    ]
  },
  'section-b': {
    required: [
      'sb_director_statement',
      'sb_esg_responsible_individual.name',
      'sb_esg_responsible_individual.designation',
      'sb_esg_responsible_individual.email',
      'sb_esg_responsible_individual.phone'
    ]
  },
  // Add more section validation rules as needed
};

/**
 * Hook for easy validation of specific sections
 * @param {string} sectionId - The section to validate
 * @returns {Object} - Validation functions for the section
 */
export const useSectionValidation = (sectionId) => {
  const validation = useFormValidation();
  const rules = SECTION_VALIDATION_RULES[sectionId] || { required: [], optional: [] };

  const validateSection = (data) => {
    return validation.validateRequiredFields(sectionId, data, rules.required);
  };

  return {
    ...validation,
    validateSection,
    rules
  };
};
