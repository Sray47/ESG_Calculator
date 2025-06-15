import React, { useState, useEffect } from 'react';

/**
 * Simple toast notification component for form feedback
 * @param {Object} props
 * @param {string} props.message - The message to display
 * @param {string} props.type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} props.duration - Duration in milliseconds (default: 4000)
 * @param {Function} props.onClose - Callback when toast is closed
 */
const Toast = ({ message, type = 'info', duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxWidth: '400px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease',
    };

    const typeStyles = {
      success: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
      },
      error: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
      },
      warning: {
        backgroundColor: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeaa7',
      },
      info: {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        border: '1px solid #bee5eb',
      },
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  const getIcon = () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type] || icons.info;
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  if (!message) return null;

  return (
    <div style={getToastStyles()}>
      <span style={{ fontSize: '16px' }}>{getIcon()}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '0',
          opacity: 0.7,
          ':hover': { opacity: 1 }
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

/**
 * Toast notification manager hook
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  const ToastContainer = () => (
    <div>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
          style={{
            top: `${20 + index * 70}px`, // Stack toasts vertically
          }}
        />
      ))}
    </div>
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer,
    removeToast,
  };
};

export default Toast;
