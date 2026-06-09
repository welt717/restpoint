import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

/**
 * Reusable empty state component
 * Displays when there's no data to show
 */
const EmptyState = ({ 
  title = 'No Data', 
  message = 'There is no data to display', 
  icon: Icon = InboxIcon,
  action = null,
  actionLabel = 'Create New',
  fullHeight = false
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
      py={4}
    >
      <Icon sx={{ fontSize: 60, color: '#ccc' }} />
      <Typography variant="h6" sx={{ color: '#666' }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', maxWidth: 300 }}>
        {message}
      </Typography>
      {action && (
        <Button 
          variant="contained" 
          onClick={action}
          sx={{ mt: 2 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
