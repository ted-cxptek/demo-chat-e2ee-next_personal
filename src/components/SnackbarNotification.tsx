import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface SnackbarNotificationProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const SnackbarNotification: React.FC<SnackbarNotificationProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' }
}) => {
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={autoHideDuration} 
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SnackbarNotification;
