import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // This is where you would send error to monitoring service
      // e.g., Sentry, LogRocket, etc.
      console.error('Production error caught:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa',
          color: '#495057',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          padding: '20px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '600px'
          }}>
            <h2 style={{ 
              marginBottom: '16px',
              color: '#dc3545',
              fontSize: '24px'
            }}>
              Oops! Something went wrong
            </h2>
            
            <p style={{ 
              marginBottom: '24px', 
              fontSize: '16px',
              lineHeight: '1.5',
              color: '#6c757d'
            }}>
              We're sorry for the inconvenience. An unexpected error occurred while loading this part of the application.
            </p>

            {isDevelopment && this.state.error && (
              <details style={{
                marginBottom: '24px',
                textAlign: 'left',
                backgroundColor: '#f8f9fa',
                padding: '16px',
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Technical Details (Development Mode)
                </summary>
                <pre style={{
                  fontSize: '12px',
                  color: '#dc3545',
                  overflow: 'auto',
                  maxHeight: '200px',
                  margin: '8px 0'
                }}>
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre style={{
                    fontSize: '11px',
                    color: '#6c757d',
                    overflow: 'auto',
                    maxHeight: '150px'
                  }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {this.state.retryCount < 3 && (
                <button 
                  onClick={this.handleRetry}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  Try Again
                </button>
              )}
              
              <button 
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Reload Page
              </button>

              <button
                onClick={() => window.history.back()}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500'
                }}
              >
                Go Back
              </button>
            </div>

            {this.state.retryCount > 0 && (
              <p style={{
                marginTop: '16px',
                fontSize: '14px',
                color: '#6c757d'
              }}>
                Retry attempts: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
