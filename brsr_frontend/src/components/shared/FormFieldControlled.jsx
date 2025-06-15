import React from 'react';
import { useController } from 'react-hook-form';

const FormFieldControlled = ({
  name,
  control,
  label,
  type = 'text',
  placeholder,
  required = false,
  className = '',
  style = {},
  as = 'input',
  rows,
  options = [],
  multiple = false,
  children,
  ...props
}) => {
  const {
    field: { onChange, onBlur, value, name: fieldName, ref },
    fieldState: { invalid, error },
    formState: { isSubmitting }
  } = useController({
    name,
    control,
    defaultValue: type === 'checkbox' ? false : (as === 'select' && multiple ? [] : '')
  });

  const baseStyle = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${invalid ? '#dc3545' : '#ccc'}`,
    borderRadius: 4,
    fontSize: '1em',
    marginBottom: 12,
    background: '#fff',
    fontFamily: 'inherit',
    ...style
  };

  const textareaStyle = {
    ...baseStyle,
    minHeight: 60,
    resize: 'vertical'
  };

  const selectStyle = {
    ...baseStyle,
    cursor: 'pointer'
  };

  const checkboxStyle = {
    marginRight: 8,
    transform: 'scale(1.1)'
  };

  const labelStyle = {
    fontWeight: 500,
    marginBottom: 6,
    display: type === 'checkbox' ? 'flex' : 'block',
    alignItems: type === 'checkbox' ? 'center' : 'flex-start',
    fontSize: '1em',
    color: '#333'
  };

  const errorStyle = {
    color: '#dc3545',
    fontSize: '0.875em',
    marginTop: 4,
    marginBottom: 8
  };

  const renderField = () => {
    switch (as) {
      case 'textarea':
        return (
          <textarea
            {...props}
            ref={ref}
            name={fieldName}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows || 3}
            disabled={isSubmitting}
            style={textareaStyle}
            className={className}
          />
        );

      case 'select':
        return (
          <select
            {...props}
            ref={ref}
            name={fieldName}
            value={value || (multiple ? [] : '')}
            onChange={(e) => {
              if (multiple) {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                onChange(selectedOptions);
              } else {
                onChange(e.target.value);
              }
            }}
            onBlur={onBlur}
            disabled={isSubmitting}
            multiple={multiple}
            style={selectStyle}
            className={className}
          >
            {!multiple && <option value="">Select...</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {children}
          </select>
        );

      default:
        if (type === 'checkbox') {
          return (
            <input
              {...props}
              ref={ref}
              type="checkbox"
              name={fieldName}
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              onBlur={onBlur}
              disabled={isSubmitting}
              style={checkboxStyle}
              className={className}
            />
          );
        }

        return (
          <input
            {...props}
            ref={ref}
            type={type}
            name={fieldName}
            value={value || ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={isSubmitting}
            style={baseStyle}
            className={className}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        {type === 'checkbox' && renderField()}
        {label}
        {required && <span style={{ color: '#dc3545', marginLeft: 4 }}>*</span>}
      </label>
      {type !== 'checkbox' && renderField()}
      {error && (
        <div style={errorStyle}>
          {error.message}
        </div>
      )}
    </div>
  );
};

export default FormFieldControlled;
