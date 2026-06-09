import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

/**
 * Reusable loading state component
 * Displays a spinner with optional message
 */
const LoadingState = ({ 
  message = 'Loading...', 
  fullHeight = false,
  size = 40 
}) => {
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
    >
      <CircularProgress size={size} />
      {message && <Typography variant="body1">{message}</Typography>}
    </Box>
  );
};

export default LoadingState;
