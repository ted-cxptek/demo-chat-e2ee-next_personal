'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Send as SendIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useRouter } from 'next/navigation';
import { User, Conversation } from '../../types';
import AuthWrapper from '../../components/AuthWrapper';

const drawerWidth = 320;

const Chat: React.FC = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const {
    conversations,
    currentConversation,
    messages,
    setConversations,
    setCurrentConversation,
    sendMessage,
    createNewConversation,
    markConversationAsRead,
  } = useChatStore();

  const [message, setMessage] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mock users for demo - replace with actual user search
  const mockUsers = useMemo(() => [
    { id: '2', username: 'alice', publicKey: 'key2', createdAt: new Date() },
    { id: '3', username: 'bob', publicKey: 'key3', createdAt: new Date() },
    { id: '4', username: 'charlie', publicKey: 'key4', createdAt: new Date() },
  ], []);

  useEffect(() => {
    // Load mock conversations on component mount
    if (conversations.length === 0) {
      const mockConversations = mockUsers.map((user, index) => ({
        id: `conv_${index + 1}`,
        participants: [user, user!],
        unreadCount: Math.floor(Math.random() * 5),
        createdAt: new Date(Date.now() - Math.random() * 10000000000),
        updatedAt: new Date(),
        lastMessage: {
          id: `msg_${index + 1}`,
          conversationId: `conv_${index + 1}`,
          senderId: user.id,
          content: `Hello! This is a sample message from ${user.username}`,
          timestamp: new Date(Date.now() - Math.random() * 1000000000),
          isRead: false,
        },
      }));
      
      // Set mock conversations in the store
      setConversations(mockConversations);
    }
  }, [conversations.length, setConversations, mockUsers]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentConversation) return;

    try {
      await sendMessage(currentConversation.id, message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleNewChat = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const newConversation = await createNewConversation(selectedUsers);
      setCurrentConversation(newConversation);
      setIsNewChatOpen(false);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    markConversationAsRead(conversation.id);
    setMobileOpen(false);
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth
          onClick={() => setIsNewChatOpen(true)}
          sx={{ mb: 2 }}
        >
          New Chat
        </Button>
        <Typography variant="h6" noWrap component="div">
          Conversations
        </Typography>
      </Box>
      <List>
        {conversations.map((conversation) => {
          const otherParticipant = conversation.participants.find(p => p.id !== user?.id);
          return (
            <ListItem
              key={conversation.id}
              onClick={() => handleConversationSelect(conversation)}
              sx={{
                cursor: 'pointer',
                backgroundColor: currentConversation?.id === conversation.id ? 'primary.light' : 'transparent',
                '&:hover': {
                  backgroundColor: currentConversation?.id === conversation.id ? 'primary.light' : 'action.hover',
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={conversation.unreadCount}
                  color="error"
                  invisible={conversation.unreadCount === 0}
                >
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={otherParticipant?.username || 'Unknown User'}
                secondary={conversation.lastMessage?.content || 'No messages yet'}
                primaryTypographyProps={{
                  fontWeight: conversation.unreadCount > 0 ? 'bold' : 'normal',
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <AuthWrapper requireAuth={true}>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {currentConversation
                ? currentConversation.participants.find(p => p.id !== user?.id)?.username
                : 'Select a conversation'}
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => router.push('/profile')}
              sx={{ mr: 1 }}
            >
              <SettingsIcon />
            </IconButton>
            <IconButton color="inherit" onClick={logout}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: 8,
          }}
        >
          {currentConversation ? (
            <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
              {/* Messages Area */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                {messages
                  .filter(m => m.conversationId === currentConversation.id)
                  .map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          maxWidth: '70%',
                          backgroundColor: msg.senderId === user?.id ? 'primary.main' : 'grey.100',
                          color: msg.senderId === user?.id ? 'white' : 'text.primary',
                        }}
                      >
                        <Typography variant="body2">{msg.content}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
              </Box>

              {/* Message Input */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <SendIcon />
                </Button>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Welcome to Secure Chat
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                Select a conversation from the sidebar or start a new chat to begin messaging
              </Typography>
            </Box>
          )}
        </Box>

        {/* New Chat Dialog */}
        <Dialog open={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select users to start a conversation with:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {mockUsers.map((user) => (
                <Chip
                  key={user.id}
                  label={user.username}
                  onClick={() => {
                    if (selectedUsers.find(u => u.id === user.id)) {
                      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
                    } else {
                      setSelectedUsers([...selectedUsers, user]);
                    }
                  }}
                  color={selectedUsers.find(u => u.id === user.id) ? 'primary' : 'default'}
                  clickable
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsNewChatOpen(false)}>Cancel</Button>
            <Button
              onClick={handleNewChat}
              variant="contained"
              disabled={selectedUsers.length === 0}
            >
              Start Chat
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AuthWrapper>
  );
};

export default Chat;
