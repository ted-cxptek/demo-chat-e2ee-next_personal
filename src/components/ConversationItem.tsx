'use client';

import React from 'react';
import {
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { Conversation, User } from '../types';
import { useAuthStore } from '../stores/authStore';

interface ConversationItemProps {
  conversation: Conversation;
  currentUser: User | null;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUser,
  isSelected,
  onClick,
}) => {
  const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.id);

  const renderLastMessageTooltip = () => {
    if (!conversation.lastMessage) {
      return (
        <Box sx={{ p: 1 }}>
          <Typography variant="body2" color="text.secondary">
            No messages yet
          </Typography>
        </Box>
      );
    }

    if (!conversation.lastMessage.isEncrypted) {
      return (
        <Box sx={{ p: 1.5, maxWidth: 300 }}>
          <Typography variant="body2" color="text.secondary">
            📝 Last message (unencrypted)
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {conversation.lastMessage.content}
          </Typography>
        </Box>
      );
    }

    // For encrypted messages, show the original encrypted content (not decrypted)
    const lastMessage = conversation.lastMessage;
    const isFromCurrentUser = lastMessage.senderId === currentUser?.id;
    
    // Show the original encrypted content, not the decrypted display content
    const encryptedContentToShow = isFromCurrentUser 
      ? (lastMessage.originalContentForSender || lastMessage.contentForSender)  // Use original encrypted content if available
      : (lastMessage.originalContent || lastMessage.content);                   // Use original encrypted content if available

    return (
      <Box sx={{ p: 1.5, maxWidth: 350 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'success.main' }}>
          <strong>🔐 Encrypted Last Message</strong>
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 1, color: 'warning.main' }}>
          <strong>Encrypted Content ({isFromCurrentUser ? 'For Sender' : 'For Recipient'}):</strong>
        </Typography>
        
        <Box sx={{ 
          bgcolor: 'black', 
          color: 'lime', 
          p: 1, 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.65rem',
          maxHeight: 80,
          overflow: 'auto',
          wordBreak: 'break-all'
        }}>
          {encryptedContentToShow}
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          This shows the original encrypted hex data, not the decrypted message content
        </Typography>
      </Box>
    );
  };

  return (
    <Tooltip
      title={renderLastMessageTooltip()}
      placement="right"
      arrow
      enterDelay={300}
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            color: 'white',
            fontSize: '0.875rem',
            maxWidth: 400,
            p: 0,
            borderRadius: 2,
            '& .MuiTooltip-arrow': {
              color: 'rgba(0, 0, 0, 0.95)'
            }
          }
        }
      }}
    >
      <ListItem
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          backgroundColor: isSelected ? 'primary.light' : 'transparent',
          '&:hover': {
            backgroundColor: isSelected ? 'primary.light' : 'action.hover',
          },
        }}
      >
        <ListItemAvatar>
          <Badge
            badgeContent={0}
            color="error"
            invisible={true}
          >
            <Avatar>
              <PersonIcon />
            </Avatar>
          </Badge>
        </ListItemAvatar>
        <ListItemText
          primary={otherParticipant?.username || 'Unknown User'}
          secondary={
            <Typography 
              variant="body2" 
              component="span"
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {conversation.lastMessage?.content || 'No messages yet'}
            </Typography>
          }
          primaryTypographyProps={{
            fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal',
          }}
        />
      </ListItem>
    </Tooltip>
  );
};

export default ConversationItem;
