import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFormState } from '../../context/FormStateContext';

const FormProgressIndicator = ({ reportId, sections, isReadOnly = false }) => {
  const location = useLocation();
  const { state } = useFormState();
  
  const getCurrentSection = () => {
    const path = location.pathname;
    const segments = path.split('/');
    return segments[segments.length - 1];
  };

  const currentSection = getCurrentSection();

  const getSectionStatus = (sectionKey) => {
    const isCompleted = state.navigation.completedSections.includes(sectionKey);
    const isVisited = state.navigation.visitedSections.includes(sectionKey);
    const isDirty = state.formStates[sectionKey]?.isDirty || false;
    
    if (isCompleted) return 'completed';
    if (isDirty) return 'modified';
    if (isVisited) return 'visited';
    return 'not-visited';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'modified':
        return '●';
      case 'visited':
        return '○';
      default:
        return '○';
    }
  };

  const getStatusColor = (status, isCurrent) => {
    if (isCurrent) return '#1976d2';
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'modified':
        return '#ffc107';
      case 'visited':
        return '#6c757d';
      default:
        return '#dee2e6';
    }
  };

  return (
    <nav style={{ 
      marginBottom: '28px', 
      display: 'flex', 
      gap: '12px', 
      flexWrap: 'wrap', 
      justifyContent: 'center', 
      background: 'white', 
      borderRadius: 12, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
      padding: '18px 0' 
    }}>
      {sections.map(sec => {
        const status = getSectionStatus(sec.key);
        const isCurrent = currentSection === sec.key;
        const statusColor = getStatusColor(status, isCurrent);
        
        return (
          <Link 
            key={sec.key} 
            to={`/report-wizard/${reportId}/${sec.key}`}
            style={{
              padding: '12px 22px',
              textDecoration: 'none',
              border: 'none',
              borderRadius: '24px',
              background: isCurrent ? 'linear-gradient(90deg,#1976d2 60%,#43a047 100%)' : '#f4f7fb',
              color: isCurrent ? 'white' : '#1976d2',
              fontWeight: isCurrent ? 700 : 500,
              fontSize: '1.05em',
              boxShadow: isCurrent ? '0 2px 8px rgba(25,118,210,0.10)' : 'none',
              transition: 'all 0.2s',
              cursor: 'pointer',
              outline: isCurrent ? '2px solid #1976d2' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ 
              fontSize: '1.2em', 
              color: statusColor,
              minWidth: 16,
              textAlign: 'center'
            }}>
              {getStatusIcon(status)}
            </span>
            {sec.label}
            {status === 'modified' && !isCurrent && (
              <span style={{ 
                fontSize: '0.8em', 
                background: '#ffc107', 
                color: 'white', 
                borderRadius: '50%', 
                width: 16, 
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                !
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default FormProgressIndicator;
