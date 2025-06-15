import React from 'react';

/**
 * Reusable validation summary component for displaying form errors
 */
const ValidationSummary = ({
  errors = {},
  title = 'Please fix the following errors:',
  showTitle = true,
  style,
  className,
  variant = 'default', // 'default', 'compact', 'inline'
  ...props
}) => {
  const errorEntries = Object.entries(errors).filter(([key, value]) => value);
  
  if (errorEntries.length === 0) {
    return null;
  }

  const getBaseStyle = () => {
    const baseStyle = {
      background: '#f8d7da',
      border: '1px solid #f5c6cb',
      borderRadius: 4,
      padding: 16,
      marginBottom: 20,
      color: '#721c24'
    };

    switch (variant) {
      case 'compact':
        return {
          ...baseStyle,
          padding: 12,
          marginBottom: 16,
          fontSize: '0.9rem'
        };
      case 'inline':
        return {
          ...baseStyle,
          background: 'transparent',
          border: 'none',
          padding: 0,
          marginBottom: 12
        };
      default:
        return baseStyle;
    }
  };

  const titleStyle = {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: 12,
    color: '#721c24'
  };

  const listStyle = {
    margin: 0,
    paddingLeft: 20,
    listStyleType: 'disc'
  };

  const itemStyle = {
    marginBottom: 8,
    lineHeight: 1.4
  };

  const inlineStyle = {
    color: '#dc3545',
    fontSize: '0.875rem',
    marginBottom: 4
  };

  if (variant === 'inline') {
    return (
      <div className={`validation-summary ${className || ''}`} style={{ ...getBaseStyle(), ...style }} {...props}>
        {errorEntries.map(([key, message]) => (
          <div key={key} style={inlineStyle}>
            {message}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`validation-summary ${className || ''}`} style={{ ...getBaseStyle(), ...style }} {...props}>
      {showTitle && <div style={titleStyle}>{title}</div>}
      <ul style={listStyle}>
        {errorEntries.map(([key, message]) => (
          <li key={key} style={itemStyle}>
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationSummary;
