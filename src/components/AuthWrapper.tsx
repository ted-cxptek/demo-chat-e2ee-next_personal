'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthWrapper({ children, requireAuth = true }: AuthWrapperProps) {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" color="white">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Will be redirected by middleware
  }

  if (!requireAuth && isAuthenticated) {
    return null; // Will be redirected by middleware
  }

  return <>{children}</>;
}
