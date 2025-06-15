import { useState, useCallback } from 'react';

/**
 * Enhanced form validation hook - keeps existing patterns but adds utilities
 * NO CHANGE to existing validation logic - just cleaner organization
 */
export const useFormValidation = (initialErrors = {}) => {
  const [validationErrors, setValidationErrors] = useState(initialErrors);

  const clearError = useCallback((fieldName) => {
    setValidationErrors(prev => {
      if (!prev[fieldName]) return prev; // No change needed
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const setError = useCallback((fieldName, message) => {
    setValidationErrors(prev => ({ ...prev, [fieldName]: message }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const hasErrors = Object.keys(validationErrors).length > 0;

  return { 
    validationErrors, 
    setValidationErrors, 
    clearError, 
    setError, 
    clearAllErrors,
    hasErrors 
  };
};

/**
 * Enhanced form state hook - keeps existing patterns but adds utilities
 * NO CHANGE to existing state logic - just cleaner organization
 */
export const useFormState = (initialState) => {
  const [formData, setFormData] = useState(initialState);

  const updateField = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const updateNestedField = useCallback((path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      const result = { ...prev };
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return result;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);

  return { 
    formData, 
    setFormData, 
    updateField, 
    updateNestedField, 
    resetForm 
  };
};

/**
 * Form submission helper - keeps existing patterns but adds utilities
 * NO CHANGE to existing submission logic - just cleaner organization
 */
export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const handleSubmit = useCallback(async (submitFunction) => {
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      await submitFunction();
      setSubmitSuccess('Form saved successfully!');
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'Failed to save form');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setSubmitError('');
    setSubmitSuccess('');
  }, []);

  return {
    isSubmitting,
    submitError,
    submitSuccess,
    handleSubmit,
    clearMessages
  };
};
