import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormState } from '../../context/FormStateContext';

const NavigationGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAnyUnsavedChanges, setNavigationState } = useFormState();

  // Update current section based on location
  useEffect(() => {
    const path = location.pathname;
    const segments = path.split('/');
    const lastSegment = segments[segments.length - 1];
    
    const sectionKeys = [
      'section-a', 'section-b', 'section-c-p1', 'section-c-p2', 'section-c-p3',
      'section-c-p4', 'section-c-p5', 'section-c-p6', 'section-c-p7', 
      'section-c-p8', 'section-c-p9', 'review-submit'
    ];
    
    if (sectionKeys.includes(lastSegment)) {
      setNavigationState({ currentSection: lastSegment });
    }
  }, [location.pathname, setNavigationState]);

  // Handle browser back/forward navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasAnyUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasAnyUnsavedChanges]);

  return children;
};

export default NavigationGuard;
