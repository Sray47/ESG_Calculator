import React from 'react';

/**
 * Reusable form section container with consistent styling
 */
const FormSection = ({
  title,
  description,
  children,
  style,
  className,
  variant = 'default', // 'default', 'compact', 'bordered'
  ...props
}) => {
  const getBaseStyle = () => {
    const baseStyle = {
      background: '#f8f9fa',
      borderRadius: 8,
      padding: 20,
      marginBottom: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
    };

    switch (variant) {
      case 'compact':
        return {
          ...baseStyle,
          padding: 16,
          marginBottom: 16
        };
      case 'bordered':
        return {
          ...baseStyle,
          background: '#fff',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        };
      case 'card':
        return {
          maxWidth: 700,
          margin: '40px auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          padding: 32
        };
      default:
        return baseStyle;
    }
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: description ? 8 : 16,
    paddingBottom: 8,
    borderBottom: '2px solid #e9ecef'
  };

  const descriptionStyle = {
    fontSize: '0.9rem',
    color: '#6c757d',
    marginBottom: 20,
    lineHeight: 1.5
  };

  return (
    <div 
      className={`form-section ${className || ''}`}
      style={{ ...getBaseStyle(), ...style }}
      {...props}
    >
      {title && (
        <h3 style={titleStyle}>
          {title}
        </h3>
      )}
      {description && (
        <p style={descriptionStyle}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
};

export default FormSection;
