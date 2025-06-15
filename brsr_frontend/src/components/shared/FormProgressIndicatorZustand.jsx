import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFormStore } from '../../store/formStore';

/**
 * Enhanced form progress indicator that shows completion status,
 * visited sections, and provides quick navigation
 * @param {Object} props
 * @param {string} props.reportId - The current report ID
 * @param {Array} props.sections - Array of section objects with key and label
 * @param {boolean} props.isReadOnly - Whether the form is in read-only mode
 */
const FormProgressIndicatorZustand = ({ reportId, sections, isReadOnly = false }) => {
  const location = useLocation();
  const { sections: sectionStates, visitedSections } = useFormStore();
  
  // Calculate progress using useMemo to prevent infinite loops
  const progress = useMemo(() => {
    const sectionList = Object.values(sectionStates);
    const completed = sectionList.filter((s) => s.isComplete).length;
    const total = sectionList.length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  }, [sectionStates]);
  
  const getCurrentSection = () => {
    const path = location.pathname;
    const segments = path.split('/');
    return segments[segments.length - 1];
  };

  const currentSection = getCurrentSection();

  const getSectionStatus = (sectionKey) => {
    const section = sectionStates[sectionKey];
    if (!section) return 'not-visited';
    
    if (section.isComplete) return 'completed';
    if (section.isDirty) return 'modified';
    if (visitedSections.includes(sectionKey)) return 'visited';
    return 'not-visited';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'modified':
        return '○';
      case 'visited':
        return '◐';
      case 'not-visited':
      default:
        return '○';
    }
  };

  const getStatusColor = (status, isCurrent) => {
    if (isCurrent) return '#1976d2';
    
    switch (status) {
      case 'completed':
        return '#43a047';
      case 'modified':
        return '#f9a825';
      case 'visited':
        return '#90a4ae';
      case 'not-visited':
      default:
        return '#ccc';
    }
  };

  const progressBarStyle = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '16px',
  };

  const progressFillStyle = {
    height: '100%',
    backgroundColor: '#43a047',
    width: `${progress.percentage}%`,
    transition: 'width 0.3s ease',
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #e3e8ee'
    }}>
      {/* Progress Overview */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h4 style={{ margin: 0, color: '#1a237e', fontSize: '1.1em' }}>
            Form Progress
          </h4>
          <span style={{ 
            color: '#607d8b', 
            fontSize: '0.9em',
            fontWeight: 500
          }}>
            {progress.completed} of {progress.total} sections complete ({progress.percentage}%)
          </span>
        </div>
        <div style={progressBarStyle}>
          <div style={progressFillStyle}></div>
        </div>
      </div>

      {/* Section Navigation */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px',
        justifyContent: 'center'
      }}>
        {sections.map(section => {
          const status = getSectionStatus(section.key);
          const isCurrent = currentSection === section.key;
          const statusColor = getStatusColor(status, isCurrent);
          
          return (
            <Link
              key={section.key}
              to={isReadOnly ? '#' : `/report-wizard/${reportId}/${section.key}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                textDecoration: 'none',
                border: `2px solid ${statusColor}`,
                borderRadius: '20px',
                backgroundColor: isCurrent ? statusColor : 'transparent',
                color: isCurrent ? 'white' : statusColor,
                fontSize: '0.85em',
                fontWeight: isCurrent ? 600 : 500,
                transition: 'all 0.2s ease',
                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                opacity: isReadOnly ? 0.6 : 1,
                minHeight: '32px',
                boxSizing: 'border-box'
              }}
              onClick={isReadOnly ? (e) => e.preventDefault() : undefined}
            >
              <span style={{ 
                fontSize: '1.1em', 
                lineHeight: 1,
                minWidth: '16px',
                textAlign: 'center'
              }}>
                {getStatusIcon(status)}
              </span>
              <span>{section.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Status Legend */}
      <div style={{ 
        marginTop: '16px', 
        paddingTop: '12px', 
        borderTop: '1px solid #eee',
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        fontSize: '0.75em',
        color: '#607d8b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#43a047' }}>✓</span> Complete
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#f9a825' }}>○</span> Modified
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#90a4ae' }}>◐</span> Visited
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: '#ccc' }}>○</span> Not Visited
        </div>
      </div>
    </div>
  );
};

export default FormProgressIndicatorZustand;
