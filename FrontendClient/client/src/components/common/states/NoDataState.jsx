import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Reusable no data state component
 * Lightweight alternative to EmptyState
 */
const NoDataState = ({ 
  message = 'No data available',
  variant = 'body2',
  textAlign = 'center',
  color = '#999',
  py = 2
}) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      width="100%"
      py={py}
    >
      <Typography 
        variant={variant} 
        sx={{ color, textAlign }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default NoDataState;
