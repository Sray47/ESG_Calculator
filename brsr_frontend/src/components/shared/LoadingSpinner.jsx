import React from 'react';

/**
 * Reusable loading spinner component
 */
const LoadingSpinner = ({
  size = 'medium', // 'small', 'medium', 'large'
  color = '#007bff',
  text = 'Loading...',
  showText = true,
  style,
  className,
  ...props
}) => {
  const getSizeStyle = () => {
    const sizes = {
      small: { width: 20, height: 20, borderWidth: 2 },
      medium: { width: 32, height: 32, borderWidth: 3 },
      large: { width: 48, height: 48, borderWidth: 4 }
    };
    return sizes[size] || sizes.medium;
  };

  const sizeStyle = getSizeStyle();

  const spinnerStyle = {
    border: `${sizeStyle.borderWidth}px solid #f3f3f3`,
    borderTop: `${sizeStyle.borderWidth}px solid ${color}`,
    borderRadius: '50%',
    width: sizeStyle.width,
    height: sizeStyle.height,
    animation: 'spin 1s linear infinite',
    margin: showText ? '0 auto 12px' : '0 auto'
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    ...style
  };

  const textStyle = {
    fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
    color: '#6c757d',
    fontWeight: 500
  };

  return (
    <div className={`loading-spinner ${className || ''}`} style={containerStyle} {...props}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={spinnerStyle}></div>
      {showText && text && <div style={textStyle}>{text}</div>}
    </div>
  );
};

export default LoadingSpinner;
