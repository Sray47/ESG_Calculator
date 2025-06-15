import { createContext, useContext, useReducer, useCallback } from 'react';

// Action types
const FORM_ACTIONS = {
  SET_FORM_DATA: 'SET_FORM_DATA',
  SET_FORM_DIRTY: 'SET_FORM_DIRTY',
  SET_FORM_ERROR: 'SET_FORM_ERROR',
  SET_FORM_SUCCESS: 'SET_FORM_SUCCESS',
  CLEAR_FORM_MESSAGES: 'CLEAR_FORM_MESSAGES',
  SET_NAVIGATION_STATE: 'SET_NAVIGATION_STATE',
  SET_VALIDATION_ERRORS: 'SET_VALIDATION_ERRORS',
};

// Initial state
const initialState = {
  // Form data cache for each section
  formData: {
    sectionA: null,
    sectionB: null,
    sectionC: {
      principle1: null,
      principle2: null,
      principle3: null,
      principle4: null,
      principle5: null,
      principle6: null,
      principle7: null,
      principle8: null,
      principle9: null,
    }
  },
  
  // Form states
  formStates: {
    sectionA: { isDirty: false, error: null, success: null, validationErrors: {} },
    sectionB: { isDirty: false, error: null, success: null, validationErrors: {} },
    sectionC: {
      principle1: { isDirty: false, error: null, success: null, validationErrors: {} },
      principle2: { isDirty: false, error: null, success: null, validationErrors: {} },
      principle3: { isDirty: false, error: null, success: null, validationErrors: {} },
      principle4: { isDirty: false, error: null, success: null, validationErrors: {} },
      principle5: { isDirty: false, error: null, success: null, validationErrors: {} },
      principle6: { isDirty: false, error: null, success: null, validationErrors: {} },
      principle7: { isDirty: false, error: null, success: null, validationErrors: {} },
      principle8: { isDirty: false, error: null, success: null, validationErrors: {} },
      principle9: { isDirty: false, error: null, success: null, validationErrors: {} },
    }
  },
  
  // Navigation state
  navigation: {
    currentSection: 'section-a',
    visitedSections: ['section-a'],
    completedSections: [],
    hasUnsavedChanges: false,
  }
};

// Reducer function
const formStateReducer = (state, action) => {
  switch (action.type) {
    case FORM_ACTIONS.SET_FORM_DATA:
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.section]: action.data
        }
      };
      
    case FORM_ACTIONS.SET_FORM_DIRTY:
      return {
        ...state,
        formStates: {
          ...state.formStates,
          [action.section]: {
            ...state.formStates[action.section],
            isDirty: action.isDirty
          }
        },
        navigation: {
          ...state.navigation,
          hasUnsavedChanges: action.isDirty
        }
      };
      
    case FORM_ACTIONS.SET_FORM_ERROR:
      return {
        ...state,
        formStates: {
          ...state.formStates,
          [action.section]: {
            ...state.formStates[action.section],
            error: action.error,
            success: null // Clear success when setting error
          }
        }
      };
      
    case FORM_ACTIONS.SET_FORM_SUCCESS:
      return {
        ...state,
        formStates: {
          ...state.formStates,
          [action.section]: {
            ...state.formStates[action.section],
            success: action.success,
            error: null, // Clear error when setting success
            isDirty: false // Form is clean after successful save
          }
        },
        navigation: {
          ...state.navigation,
          hasUnsavedChanges: false,
          completedSections: state.navigation.completedSections.includes(action.section)
            ? state.navigation.completedSections
            : [...state.navigation.completedSections, action.section]
        }
      };
      
    case FORM_ACTIONS.CLEAR_FORM_MESSAGES:
      return {
        ...state,
        formStates: {
          ...state.formStates,
          [action.section]: {
            ...state.formStates[action.section],
            error: null,
            success: null
          }
        }
      };
      
    case FORM_ACTIONS.SET_NAVIGATION_STATE:
      return {
        ...state,
        navigation: {
          ...state.navigation,
          ...action.navigationState,
          visitedSections: action.navigationState.currentSection && 
            !state.navigation.visitedSections.includes(action.navigationState.currentSection)
            ? [...state.navigation.visitedSections, action.navigationState.currentSection]
            : state.navigation.visitedSections
        }
      };
      
    case FORM_ACTIONS.SET_VALIDATION_ERRORS:
      return {
        ...state,
        formStates: {
          ...state.formStates,
          [action.section]: {
            ...state.formStates[action.section],
            validationErrors: action.errors
          }
        }
      };
      
    default:
      return state;
  }
};

// Context
const FormStateContext = createContext();

// Provider component
export const FormStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(formStateReducer, initialState);
  
  // Action creators
  const setFormData = useCallback((section, data) => {
    dispatch({ type: FORM_ACTIONS.SET_FORM_DATA, section, data });
  }, []);
  
  const setFormDirty = useCallback((section, isDirty) => {
    dispatch({ type: FORM_ACTIONS.SET_FORM_DIRTY, section, isDirty });
  }, []);
  
  const setFormError = useCallback((section, error) => {
    dispatch({ type: FORM_ACTIONS.SET_FORM_ERROR, section, error });
  }, []);
  
  const setFormSuccess = useCallback((section, success) => {
    dispatch({ type: FORM_ACTIONS.SET_FORM_SUCCESS, section, success });
  }, []);
  
  const clearFormMessages = useCallback((section) => {
    dispatch({ type: FORM_ACTIONS.CLEAR_FORM_MESSAGES, section });
  }, []);
  
  const setNavigationState = useCallback((navigationState) => {
    dispatch({ type: FORM_ACTIONS.SET_NAVIGATION_STATE, navigationState });
  }, []);
  
  const setValidationErrors = useCallback((section, errors) => {
    dispatch({ type: FORM_ACTIONS.SET_VALIDATION_ERRORS, section, errors });
  }, []);
  
  // Utility functions
  const getSectionFormState = useCallback((section) => {
    return state.formStates[section] || { isDirty: false, error: null, success: null, validationErrors: {} };
  }, [state.formStates]);
  
  const getSectionData = useCallback((section) => {
    return state.formData[section];
  }, [state.formData]);
  
  const isFormDirty = useCallback((section) => {
    return state.formStates[section]?.isDirty || false;
  }, [state.formStates]);
  
  const hasAnyUnsavedChanges = useCallback(() => {
    return state.navigation.hasUnsavedChanges;
  }, [state.navigation.hasUnsavedChanges]);
  
  const isSectionCompleted = useCallback((section) => {
    return state.navigation.completedSections.includes(section);
  }, [state.navigation.completedSections]);
  
  const value = {
    // State
    state,
    
    // Actions
    setFormData,
    setFormDirty,
    setFormError,
    setFormSuccess,
    clearFormMessages,
    setNavigationState,
    setValidationErrors,
    
    // Utilities
    getSectionFormState,
    getSectionData,
    isFormDirty,
    hasAnyUnsavedChanges,
    isSectionCompleted,
  };
  
  return (
    <FormStateContext.Provider value={value}>
      {children}
    </FormStateContext.Provider>
  );
};

// Hook to use form state
export const useFormState = () => {
  const context = useContext(FormStateContext);
  if (!context) {
    throw new Error('useFormState must be used within a FormStateProvider');
  }
  return context;
};

// Hook for specific section
export const useSectionState = (sectionKey) => {
  const context = useFormState();
  
  return {
    formState: context.getSectionFormState(sectionKey),
    formData: context.getSectionData(sectionKey),
    isDirty: context.isFormDirty(sectionKey),
    isCompleted: context.isSectionCompleted(sectionKey),
    
    setData: (data) => context.setFormData(sectionKey, data),
    setDirty: (isDirty) => context.setFormDirty(sectionKey, isDirty),
    setError: (error) => context.setFormError(sectionKey, error),
    setSuccess: (success) => context.setFormSuccess(sectionKey, success),
    clearMessages: () => context.clearFormMessages(sectionKey),
    setValidationErrors: (errors) => context.setValidationErrors(sectionKey, errors),
  };
};
