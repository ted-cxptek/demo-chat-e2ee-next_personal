'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Snackbar,
  Container,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import AuthWrapper from '../../components/AuthWrapper';
import { useRouter } from 'next/navigation';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [copySuccess, setCopySuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
  });
  const router = useRouter();

  const handleCopySeedPhrase = async () => {
    if (user?.seedPhrase) {
      try {
        await navigator.clipboard.writeText(user.seedPhrase);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const handleSaveProfile = () => {
    if (user) {
      const updatedUser = {
        ...user,
        username: editForm.username,
      };
      updateUser(updatedUser);
      setEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: user?.username || '',
    });
    setEditing(false);
  };

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            User not found. Please log in again.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <AuthWrapper requireAuth={true}>
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom color="primary">
                Profile Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your account settings and security information
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => router.push('/chat')}
              sx={{ minWidth: 120 }}
            >
              Back to Chat
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Profile Information */}
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Profile Information</Typography>
                  </Box>
                  
                  {editing ? (
                    <Box>
                      <TextField
                        fullWidth
                        label="Username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        sx={{ mb: 2 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="contained" onClick={handleSaveProfile}>
                          Save
                        </Button>
                        <Button variant="outlined" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Username
                        </Typography>
                        <Typography variant="body1">{user.username}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Member Since
                        </Typography>
                        <Typography variant="body1">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button variant="outlined" onClick={() => setEditing(true)}>
                        Edit Profile
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/* Security Information */}
            <Box sx={{ flex: 1 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Security & Keys</Typography>
                  </Box>

                  {user.derivedPublicKey && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Derived Public Key (From Seed Phrase)
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          backgroundColor: 'blue.50', 
                          p: 1, 
                          borderRadius: 1,
                          wordBreak: 'break-all'
                        }}
                      >
                        {user.derivedPublicKey}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Seed Phrase
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      ⚠️ Keep this secret! Anyone with access to your seed phrase can control your account.
                    </Typography>
                    
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={user.seedPhrase || 'No seed phrase available'}
                      InputProps={{
                        readOnly: true,
                        style: { fontFamily: 'monospace', fontSize: '12px' }
                      }}
                      sx={{ mb: 2 }}
                    />
                    
                    <Button
                      variant="contained"
                      startIcon={<CopyIcon />}
                      onClick={handleCopySeedPhrase}
                      size="small"
                    >
                      Copy to Clipboard
                    </Button>
                  </Box>

                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Security Warning:</strong> Never share your seed phrase with anyone. 
                      Store it securely offline for backup purposes only.
                    </Typography>
                  </Alert>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>

        {/* Copy Success Snackbar */}
        <Snackbar
          open={copySuccess}
          autoHideDuration={3000}
          onClose={() => setCopySuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setCopySuccess(false)} severity="success">
            Seed phrase copied to clipboard!
          </Alert>
        </Snackbar>
      </Container>
    </AuthWrapper>
  );
};

export default Profile;
