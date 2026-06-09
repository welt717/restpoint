import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Reusable error state component
 * Displays when an error occurs
 */
const ErrorState = ({ 
  title = 'Error', 
  message = 'An error occurred while loading data',
  error = null,
  onRetry = null,
  retryLabel = 'Retry',
  fullHeight = false,
  severity = 'error'
}) => {
  const errorMessage = error?.message || message;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      height={fullHeight ? '100vh' : 'auto'}
      minHeight={fullHeight ? '100vh' : '200px'}
      width="100%"
      py={4}
      px={2}
    >
      <ErrorIcon sx={{ fontSize: 60, color: '#d32f2f' }} />
      <Typography variant="h6" sx={{ color: '#d32f2f' }}>
        {title}
      </Typography>
      <Alert severity={severity} sx={{ maxWidth: 500 }}>
        {errorMessage}
      </Alert>
      {onRetry && (
        <Button 
          variant="contained" 
          onClick={onRetry}
          sx={{ mt: 2 }}
        >
          {retryLabel}
        </Button>
      )}
    </Box>
  );
};

export default ErrorState;
