'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthWrapper({ children, requireAuth = true }: AuthWrapperProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle authentication redirects in useEffect
  useEffect(() => {
    if (mounted && !isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
      } else if (!requireAuth && isAuthenticated) {
        router.push('/chat');
      }
    }
  }, [mounted, isLoading, requireAuth, isAuthenticated, router]);

  // For public pages (login/register), show content immediately after mounting
  if (!requireAuth) {
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
    
    // If user is already authenticated, redirect to chat
    if (isAuthenticated) {
      return null; // Will redirect in useEffect
    }
    
    // Show login/register form immediately
    return <>{children}</>;
  }

  // For protected pages, show loading while store hydrates
  if (!mounted || isLoading) {
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

  // If redirecting, show nothing (let the router handle it)
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Render children when authenticated and ready
  return <>{children}</>;
}
