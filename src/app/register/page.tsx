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

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  
  const { register, isLoading, errorMessage, successMessage, clearError, clearSuccess, setValidationError } = useAuthStore();
  const router = useRouter();

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
      clearSuccess();
    };
  }, [clearError, clearSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear errors when user starts typing
    if (errorMessage) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear any previous errors

    if (formData.password !== formData.confirmPassword) {
      // Set local validation error in store
      setValidationError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      // Set local validation error in store
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (formData.username.length < 3) {
      // Set local validation error in store
      setValidationError('Username must be at least 3 characters.');
      return;
    }

    try {
      await register(formData);
      // AuthWrapper will automatically redirect to /chat when isAuthenticated becomes true
      // No need to manually call router.push('/chat')
    } catch (err) {
      // Error is already handled in the store, no need to handle it here
      console.error('Registration error:', err);
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
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join our secure messaging platform
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
                onClose={clearError}
              >
                <Typography variant="body2" component="div">
                  {errorMessage}
                </Typography>
                {errorMessage.includes('Username is already taken') && (
                  <Typography variant="caption" component="div" sx={{ mt: 1, opacity: 0.8 }}>
                    💡 Tip: Try adding numbers or special characters to make it unique
                  </Typography>
                )}
                {errorMessage.includes('Password is too weak') && (
                  <Typography variant="caption" component="div" sx={{ mt: 1, opacity: 0.8 }}>
                    💡 Tip: Use a mix of letters, numbers, and special characters
                  </Typography>
                )}
                {errorMessage.includes('Passwords do not match') && (
                  <Typography variant="caption" component="div" sx={{ mt: 1, opacity: 0.8 }}>
                    💡 Tip: Make sure both password fields are identical
                  </Typography>
                )}
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
                onClose={clearSuccess}
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
                value={formData.username}
                onChange={handleChange}
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
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
              </Button>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link component={NextLink} href="/login" variant="body2">
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </AuthWrapper>
  );
};

export default Register;
