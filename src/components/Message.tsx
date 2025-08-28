'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  isCurrentUserMessage: boolean;
  formatMessageTime: (timestamp: string) => string;
}

const Message: React.FC<MessageProps> = ({ message, isCurrentUserMessage, formatMessageTime }) => {
  const { user } = useAuthStore();

  const renderEncryptedObjectTooltip = () => {
    if (!message.isEncrypted) {
      return (
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" color="text.secondary">
            📝 Unencrypted message
          </Typography>
        </Box>
      );
    }

    // Determine which original encrypted content to show based on sender
    const isFromCurrentUser = message.senderId === user?.id;
    const encryptedContentToShow = isFromCurrentUser 
      ? (message.originalContentForSender || message.contentForSender)  // Use original encrypted content if available
      : (message.originalContent || message.content);                   // Use original encrypted content if available

    return (
      <Box sx={{ p: 2, maxWidth: 400 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ color: 'success.main' }}>
          🔐 Encrypted Message Object
        </Typography>
        
        {/* Show the correct encrypted content */}
        <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'warning.main' }}>
          <strong>🔒 Original Encrypted Content ({isFromCurrentUser ? 'For Sender' : 'For Recipient'}):</strong>
        </Typography>
          <Box sx={{ 
            bgcolor: 'black', 
            color: 'lime', 
            p: 1.5, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            border: '1px solid rgba(255,255,255,0.2)',
            maxHeight: 100,
            overflow: 'auto',
            wordBreak: 'break-all'
          }}>
            {encryptedContentToShow}
          </Box>
        </Box>

        {/* Show the full message object */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>📋 Full Message Object:</strong>
          </Typography>
          <Box sx={{ 
            bgcolor: 'rgba(0,0,0,0.8)', 
            color: 'lime', 
            p: 1.5, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            maxHeight: 150,
            overflow: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(message, null, 2)}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isCurrentUserMessage ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Tooltip
        title={renderEncryptedObjectTooltip()}
        placement="top"
        arrow
        enterDelay={500}
        leaveDelay={200}
        PopperProps={{
          sx: {
            '& .MuiTooltip-tooltip': {
              bgcolor: 'rgba(0, 0, 0, 0.95)',
              color: 'white',
              fontSize: '0.875rem',
              maxWidth: 500,
              p: 0,
              borderRadius: 2,
              '& .MuiTooltip-arrow': {
                color: 'rgba(0, 0, 0, 0.95)'
              }
            }
          }
        }}
      >
        <Paper
          sx={{
            p: 1.5,
            maxWidth: '70%',
            backgroundColor: isCurrentUserMessage ? 'primary.main' : 'grey.100',
            color: isCurrentUserMessage ? 'white' : 'text.primary',
            cursor: 'help',
            position: 'relative',
          }}
        >
          <Typography variant="body2">{message.content}</Typography>
          
          {/* Encryption indicator */}
          {message.isEncrypted && (
            <LockIcon 
              sx={{ 
                position: 'absolute',
                top: 4,
                right: 4,
                fontSize: '0.875rem', 
                color: isCurrentUserMessage ? 'rgba(255,255,255,0.8)' : 'success.main',
                opacity: 0.8
              }} 
            />
          )}
          
          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
            {formatMessageTime(message.createdAt)}
          </Typography>
        </Paper>
      </Tooltip>
    </Box>
  );
};

export default Message;
