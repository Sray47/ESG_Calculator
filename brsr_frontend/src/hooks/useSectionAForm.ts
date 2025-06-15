import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { sectionASchema } from '../schemas/sectionASchema';
import { useFormStore } from '../store/formStore';

type SectionAFormData = any; // Using any for now to maintain compatibility

/**
 * Enhanced form hook that wraps react-hook-form while maintaining
 * the existing API for minimal code changes
 */
export const useSectionAForm = (initialData: any = {}) => {
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const { markSectionDirty, markSectionComplete, setUnsavedChanges } = useFormStore();
  
  const form = useForm<SectionAFormData>({
    resolver: zodResolver(sectionASchema),
    defaultValues: initialData,
    mode: 'onChange', // Validate on change for immediate feedback
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
    trigger
  } = form;

  // Watch all form values to provide reactive data
  const formData = watch();
  // Track form changes in the store
  useEffect(() => {
    if (isDirty) {
      markSectionDirty('section-a');
      setUnsavedChanges(true);
    }
  }, [isDirty]); // Remove store functions from dependencies

  // Helper function to set nested values (maintains existing API)
  const handleNestedChange = (path: string, value: any) => {
    const keys = path.split('.');
    const fieldName = keys[0];
    
    if (keys.length === 1) {
      setValue(fieldName, value, { shouldValidate: true, shouldDirty: true });
    } else {
      // Handle nested objects
      const currentValue = getValues(fieldName) || {};
      const updatedValue = setNestedValueHelper(currentValue, keys.slice(1), value);
      setValue(fieldName, updatedValue, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Helper function for setting nested values
  const setNestedValueHelper = (obj: any, keys: string[], value: any): any => {
    const result = { ...obj };
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current[key] = { ...current[key] };
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return result;
  };

  // Helper for array operations (maintains existing API)
  const handleArrayObjectChange = (arrayName: string, index: number, field: string, value: any) => {
    const currentArray = getValues(arrayName) || [];
    const updatedArray = [...currentArray];
    updatedArray[index] = { ...updatedArray[index], [field]: value };
    setValue(arrayName, updatedArray, { shouldValidate: true, shouldDirty: true });
  };

  const addArrayItem = (arrayName: string, newItem: any) => {
    const currentArray = getValues(arrayName) || [];
    setValue(arrayName, [...currentArray, newItem], { shouldValidate: true, shouldDirty: true });
  };

  const removeArrayItem = (arrayName: string, index: number) => {
    const currentArray = getValues(arrayName) || [];
    const updatedArray = currentArray.filter((_: any, i: number) => i !== index);
    setValue(arrayName, updatedArray, { shouldValidate: true, shouldDirty: true });
  };

  // Convert react-hook-form errors to the format expected by existing components
  const getValidationErrors = (): Record<string, string> => {
    const convertedErrors: Record<string, string> = {};
    
    const flattenErrors = (errorObj: any, prefix = '') => {
      Object.keys(errorObj).forEach(key => {
        const error = errorObj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (error?.message) {
          convertedErrors[fullKey] = error.message;
        } else if (error && typeof error === 'object') {
          flattenErrors(error, fullKey);
        }
      });
    };
    
    flattenErrors(errors);
    return convertedErrors;
  };
  // Enhanced submit handler that maintains existing API
  const createSubmitHandler = (onSubmit: (data: any) => Promise<void> | void) => {
    return handleSubmit(async (data) => {
      try {
        setLocalError('');
        setLocalSuccess('');
        await onSubmit(data);
        setLocalSuccess('Form saved successfully!');
        
        // Mark section as complete and clear unsaved changes
        markSectionComplete('section-a');
        setUnsavedChanges(false);
      } catch (error: any) {
        console.error('Form submission error:', error);
        setLocalError(error?.message || 'Failed to save form');
      }
    });
  };

  // Initialize form with data when it changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return {
    // React Hook Form internals (for advanced usage)
    form,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    
    // Current form state
    formData,
    errors: getValidationErrors(),
    isSubmitting,
    isDirty,
    isValid,
    
    // Existing API compatibility
    handleNestedChange,
    handleArrayObjectChange,
    addArrayItem,
    removeArrayItem,
    createSubmitHandler,
    
    // Local state management
    localError,
    localSuccess,
    setLocalError,
    setLocalSuccess,
    
    // Utility functions
    clearErrors: () => setLocalError(''),
    clearSuccess: () => setLocalSuccess(''),
    validateField: (fieldName: string) => trigger(fieldName),
    validateForm: () => trigger(),
  };
};
