'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import SnackbarNotification from '../components/SnackbarNotification';

type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

interface NotificationContextType {
  showSnackbar: (message: string, severity?: SnackbarSeverity) => void;
  hideSnackbar: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  autoHideDuration?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  autoHideDuration = 6000 
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>('success');

  const showSnackbar = useCallback((message: string, severity: SnackbarSeverity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const value: NotificationContextType = {
    showSnackbar,
    hideSnackbar,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <SnackbarNotification
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={hideSnackbar}
        autoHideDuration={autoHideDuration}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
