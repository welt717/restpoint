import React from 'react';
import { Alert, AlertTitle, Button, Box, Typography } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
          <Alert 
            severity="error" 
            variant="outlined"
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={this.handleReset}
              >
                Try Again
              </Button>
            }
          >
            <AlertTitle>Something went wrong</AlertTitle>
            {this.props.errorMessage || 'An unexpected error occurred.'}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                {this.state.error.toString()}
              </Typography>
            )}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;