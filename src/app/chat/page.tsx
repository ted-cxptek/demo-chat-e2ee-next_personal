'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  CircularProgress,
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
import { useNotification } from '../../contexts/NotificationContext';

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
    fetchConversations,
    fetchMessages,
    isLoading,
    isSendingMessage,
  } = useChatStore();

  const [message, setMessage] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Use the notification context
  const { showSnackbar } = useNotification();

  // Helper function to format timestamp safely
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return date.toLocaleTimeString();
    } catch (error) {
      return 'Invalid time';
    }
  };

  // Auto-scroll to bottom when messages change
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentConversation?.id]);

  useEffect(() => {
    // Fetch real conversations from API
    if (conversations.length === 0) {
      fetchConversations();
    }
  }, [conversations.length, fetchConversations]);

  // Fetch messages for current conversation when it changes
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation.id);
    }
  }, [currentConversation?.id, fetchMessages]);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentConversation) return;

    try {
      await sendMessage(currentConversation.id, message);
      setMessage('');
      showSnackbar('Message sent successfully!', 'success');
    } catch (error) {
      console.error('Failed to send message:', error);
      showSnackbar('Failed to send message', 'error');
    }
  };

  const handleNewChat = async () => {
    if (!selectedUsername.trim()) return;

    setIsCreatingConversation(true);
    try {
      // Create conversation using the API with receiverUsername
      const newConversation = await createNewConversation(selectedUsername);
      setCurrentConversation(newConversation);
      setIsNewChatOpen(false);
      setSelectedUsername('');
      
      // Refresh conversations list to show the new one
      await fetchConversations();
      showSnackbar('Conversation started!');
    } catch (error) {

      // Show specific error message if available
      let errorMessage = 'Failed to start conversation.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      showSnackbar(errorMessage, 'error');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMobileOpen(false);
    
    // Fetch messages for the selected conversation
    try {
      setIsLoadingMessages(true);
      await fetchMessages(conversation.id);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      showSnackbar('Failed to load messages', 'error');
    } finally {
      setIsLoadingMessages(false);
    }
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
        <Button
          variant="outlined"
          fullWidth
          onClick={fetchConversations}
          disabled={isLoading}
          sx={{ mb: 2 }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Conversations'}
        </Button>
        <Typography variant="h6" noWrap component="div">
          Conversations
        </Typography>
      </Box>
      <List>
        {isLoading ? (
          <ListItem>
            <ListItemText
              primary="Loading conversations..."
              secondary="Please wait while we fetch your conversations"
            />
          </ListItem>
        ) : conversations.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="No conversations yet"
              secondary="Start a new chat to begin messaging"
            />
          </ListItem>
        ) : (
          conversations.map((conversation) => {
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
          })
        )}
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
              <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2, position: 'relative' }}>
                {isLoadingMessages ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <CircularProgress />
                  </Box>
                ) : messages.filter(m => m.conversationId === currentConversation.id).length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <Typography variant="body2" color="text.secondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {messages
                      .filter(m => m.conversationId === currentConversation.id)
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) // Sort by timestamp (oldest first)
                      .map((msg) => (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            justifyContent: msg.sender === user?.id ? 'flex-end' : 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Paper
                            sx={{
                              p: 1.5,
                              maxWidth: '70%',
                              backgroundColor: msg.sender === user?.id ? 'primary.main' : 'grey.100',
                              color: msg.sender === user?.id ? 'white' : 'text.primary',
                            }}
                          >
                            <Typography variant="body2">{msg.content}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {formatMessageTime(msg.createdAt)}
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Message Input */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSendingMessage && handleSendMessage()}
                  disabled={isSendingMessage}
                />
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSendingMessage}
                >
                  {isSendingMessage ? <CircularProgress size={20} /> : <SendIcon />}
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
        <Dialog 
          open={isNewChatOpen} 
          onClose={() => !isCreatingConversation && setIsNewChatOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Start New Conversation</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the username of the person you want to chat with:
            </Typography>
            <TextField
              fullWidth
              label="Username"
              placeholder="Enter username (e.g., bob)"
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isCreatingConversation && handleNewChat()}
              disabled={isCreatingConversation}
              sx={{ mb: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              💡 The conversation will be created automatically if it doesn't exist
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setIsNewChatOpen(false)} 
              disabled={isCreatingConversation}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNewChat}
              variant="contained"
              disabled={!selectedUsername.trim() || isCreatingConversation}
              startIcon={isCreatingConversation ? <CircularProgress size={20} /> : undefined}
            >
              {isCreatingConversation ? 'Creating...' : 'Start Chat'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AuthWrapper>
  );
};

export default Chat;
