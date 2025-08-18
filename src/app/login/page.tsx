'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import AuthWrapper from '../../components/AuthWrapper';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const { login, isLoading, errorMessage, successMessage, clearError, clearSuccess } = useAuthStore();
  const router = useRouter();

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errorMessage) clearError(); // Clear error when user starts typing
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage) clearError(); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear any previous errors
    
    try {
      await login({ username, password });
      router.push('/chat');
    } catch (err) {
      // Error is already handled in the store, no need to handle it here
      console.error('Login error:', err);
    }
  };

  return (
    <AuthWrapper requireAuth={false}>
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              width: '100%',
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom color="primary">
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to continue to your secure chat
              </Typography>
            </Box>

            {errorMessage && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.9rem',
                    lineHeight: 1.4
                  }
                }}
                onClose={() => clearError()}
              >
                <Typography variant="body2" component="div">
                  {errorMessage}
                </Typography>
              </Alert>
            )}

            {successMessage && (
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 2,
                  '& .MuiAlert-message': {
                    fontSize: '0.9rem',
                    lineHeight: 1.4
                  }
                }}
                onClose={() => clearSuccess()}
              >
                <Typography variant="body2" component="div">
                  {successMessage}
                </Typography>
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={handleUsernameChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                  },
                }}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don&apos;t have an account?{' '}
                  <Link component={NextLink} href="/register" variant="body2">
                    Sign up here
                  </Link>
                </Typography>
              </Box>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Demo credentials: alice / password
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </AuthWrapper>
  );
};

export default Login;
