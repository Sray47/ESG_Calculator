import React from 'react';

/**
 * Reusable form field component with consistent styling and validation
 * Enhanced to work with react-hook-form
 */
const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  rows = 3,
  min,
  max,
  step,
  options = [],
  multiple = false,
  error,
  helperText,
  style,
  className,
  register, // react-hook-form register function
  ...props
}) => {
  const baseInputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: 4,
    fontSize: '1em',
    marginBottom: 4,
    background: '#fff',
    fontFamily: 'inherit',
    borderColor: error ? '#dc3545' : '#ccc',
    ...style
  };

  const labelStyle = {
    fontWeight: 500,
    marginBottom: 6,
    display: 'block',
    fontSize: '1em',
    color: '#333'
  };

  const errorStyle = {
    color: '#dc3545',
    fontSize: '0.875em',
    marginTop: 4,
    marginBottom: 8
  };

  const helperTextStyle = {
    color: '#6c757d',
    fontSize: '0.875em',
    marginTop: 4,
    marginBottom: 8
  };

  // Determine the input props based on whether react-hook-form is being used
  const inputProps = register ? 
    { ...register(name), ...props } : 
    { 
      value: value || '', 
      onChange, 
      onBlur, 
      ...props 
    };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            style={{ ...baseInputStyle, minHeight: 60 }}
            className={className}
            {...inputProps}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            name={name}
            required={required}
            disabled={disabled}
            multiple={multiple}
            style={baseInputStyle}
            className={className}
            {...inputProps}
          >
            {!required && !multiple && <option value="">Select an option</option>}
            {options.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            style={baseInputStyle}
            className={className}
            {...inputProps}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            style={baseInputStyle}
            className={className}
            {...inputProps}
          />
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={name}
            name={name}
            required={required}
            disabled={disabled}
            style={{ marginRight: 8 }}
            className={className}
            {...(register ? { ...register(name) } : { checked: value || false, onChange })}
          />
        );

      default:
        return (
          <input
            type={type}
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            style={baseInputStyle}
            className={className}
            {...inputProps}
          />
        );
    }
  };

  return (
    <div className="form-field" style={{ marginBottom: 24 }}>
      <label htmlFor={name} style={labelStyle}>
        {label}
        {required && <span style={{ color: '#dc3545', marginLeft: 4 }}>*</span>}
      </label>
      {renderInput()}
      {error && <div style={errorStyle}>{error}</div>}
      {helperText && !error && <div style={helperTextStyle}>{helperText}</div>}
    </div>
  );
};

export default FormField;
