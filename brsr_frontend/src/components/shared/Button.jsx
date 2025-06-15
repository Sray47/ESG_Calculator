import React from 'react';

/**
 * Reusable button component with consistent styling and variants
 */
const Button = ({
  children,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'success', 'danger', 'warning', 'info'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  style,
  className,
  ...props
}) => {
  const getVariantStyle = () => {
    const variants = {
      primary: {
        background: '#007bff',
        color: '#fff',
        borderColor: '#007bff'
      },
      secondary: {
        background: '#6c757d',
        color: '#fff',
        borderColor: '#6c757d'
      },
      success: {
        background: '#28a745',
        color: '#fff',
        borderColor: '#28a745'
      },
      danger: {
        background: '#dc3545',
        color: '#fff',
        borderColor: '#dc3545'
      },
      warning: {
        background: '#ffc107',
        color: '#212529',
        borderColor: '#ffc107'
      },
      info: {
        background: '#17a2b8',
        color: '#fff',
        borderColor: '#17a2b8'
      }
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyle = () => {
    const sizes = {
      small: {
        padding: '6px 12px',
        fontSize: '0.875rem'
      },
      medium: {
        padding: '10px 20px',
        fontSize: '1rem'
      },
      large: {
        padding: '14px 28px',
        fontSize: '1.125rem'
      }
    };
    return sizes[size] || sizes.medium;
  };

  const baseStyle = {
    border: '1px solid transparent',
    borderRadius: 6,
    fontWeight: 600,
    textAlign: 'center',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    fontFamily: 'inherit',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.65 : 1,
    ...getVariantStyle(),
    ...getSizeStyle()
  };

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`btn btn-${variant} btn-${size} ${className || ''}`}
      style={{ ...baseStyle, ...style }}
      {...props}
    >
      {loading && (
        <span style={{ marginRight: 8 }}>
          ⏳
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;
