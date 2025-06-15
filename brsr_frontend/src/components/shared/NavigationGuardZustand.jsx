import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFormStore } from '../../store/formStore';

/**
 * NavigationGuard component that manages form navigation state and prevents
 * users from losing unsaved changes when navigating away
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
const NavigationGuard = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    setCurrentSection, 
    markSectionVisited, 
    hasUnsavedChanges 
  } = useFormStore();

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
      setCurrentSection(lastSegment);
      markSectionVisited(lastSegment);
    }
  }, [location.pathname, setCurrentSection, markSectionVisited]);

  // Handle browser back/forward navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    const handlePopState = () => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm(
          'You have unsaved changes. Are you sure you want to leave this page?'
        );
        if (!confirmLeave) {
          // Push the current location back to prevent navigation
          window.history.pushState(null, '', location.pathname);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, location.pathname]);

  return <>{children}</>;
};

export default NavigationGuard;
