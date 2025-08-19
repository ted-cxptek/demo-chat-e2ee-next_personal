import { create } from 'zustand';
import { ChatState, Conversation, Message, User } from '../types';
import { chatGatewayAPI } from '../services/api';
import { websocketService } from '../services/websocketService';

interface ChatStore extends ChatState {
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setSendingMessage: (sending: boolean) => void;
  createNewConversation: (receiverUsername: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string) => Promise<Message>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  handleIncomingMessage: (message: Message) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isSendingMessage: false,

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setSendingMessage: (sending: boolean) => set({ isSendingMessage: sending }),

  setConversations: (conversations: Conversation[]) => set({ conversations }),

  addConversation: (conversation: Conversation) => 
    set((state) => ({
      conversations: [conversation, ...state.conversations]
    })),

  updateConversation: (conversationId: string, updates: Partial<Conversation>) =>
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
      currentConversation: state.currentConversation?.id === conversationId
        ? { ...state.currentConversation, ...updates }
        : state.currentConversation
    })),

  setCurrentConversation: (conversation: Conversation | null) => set({ currentConversation: conversation }),

  setMessages: (messages: Message[]) => set({ messages }),

  addMessage: (message: Message) => {
    set((state) => {
      const newMessages = [...state.messages, message];
      const updatedConversations = state.conversations.map(conv => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: conv.unreadCount + 1,
            updatedAt: new Date()
          };
        }
        return conv;
      });

      return {
        messages: newMessages,
        conversations: updatedConversations,
        currentConversation: state.currentConversation?.id === message.conversationId
          ? { ...state.currentConversation, lastMessage: message, updatedAt: new Date() }
          : state.currentConversation
      };
    });
  },

  createNewConversation: async (receiverUsername: string) => {
    try {
      // Get token from auth store
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      
      if (!token) throw new Error('No authentication token');
      
      // Create conversation via API using receiverUsername
      const newConversation = await chatGatewayAPI.createConversation(token, receiverUsername) as Conversation;
      
      // Add to local store
      get().addConversation(newConversation);
      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      set({ isSendingMessage: true });
      
      // Get token from auth store
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      
      if (!token) throw new Error('No authentication token');
      
      // TODO: Length of content is odd, so we add a space to make it even
      // Error: Cannot get GET
      const newContent = content.length % 2 === 1 ? content + ' ' : content;
      // Send message via API
      const newMessage = await chatGatewayAPI.sendMessage(token, conversationId, newContent) as Message;
      
      // Normalize the message if needed (convert 'sender' to 'senderId')
      let normalizedMessage = {
        ...newMessage,
        senderId: newMessage.sender || newMessage.senderId
      };
      
      // Add to local store
      get().addMessage(normalizedMessage);
      return normalizedMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
      
    } finally {
      set({ isSendingMessage: false });
    }
  },

  fetchConversations: async () => {
    try {
      set({ isLoading: true });
      
      // Get token from auth store
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      
      if (!token) throw new Error('No authentication token');
      
      const response = await chatGatewayAPI.getConversations(token);
      
      // Handle the API response structure
      if (response && typeof response === 'object' && 'conversations' in response) {
        const conversations = response.conversations || [];
        set({ conversations, isLoading: false });
      } else {
        // Fallback if response structure is different
        const conversations = Array.isArray(response) ? response : [];
        set({ conversations, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      // Get token from auth store
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      
      if (!token) throw new Error('No authentication token');
      
      const response = await chatGatewayAPI.getMessages(token, conversationId);
      
      // Handle the API response structure
      if (response && typeof response === 'object' && 'messages' in response) {
        const messages = response.messages || [];
        
        // Normalize messages: convert 'sender' to 'senderId' if needed
        const normalizedMessages = messages.map((msg: any) => {          
          return {
            ...msg,
            senderId: msg.sender || msg.senderId
          };
        });
        
        set({ messages: normalizedMessages, isLoading: false });
      } else {
        // Fallback if response structure is different
        const messages = Array.isArray(response) ? response : [];

        set({ messages, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ isLoading: false });
    }
  },

  // WebSocket methods
  connectWebSocket: () => {
    try {
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      const user = authState.state?.user;
      
      if (!token) {
        console.warn('No authentication token available for WebSocket connection');
        return;
      }

      if (!user) {
        console.warn('No user data available for WebSocket connection');
        return;
      }

      // Set up message handler for incoming messages
      websocketService.onMessage(get().handleIncomingMessage);
      
      // Connect to WebSocket with user ID for automatic login
      websocketService.connect(token, user.username);
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  },

  disconnectWebSocket: () => {
    try {
      websocketService.disconnect();
    } catch (error) {
      console.error('Failed to disconnect WebSocket:', error);
    }
  },

  handleIncomingMessage: (message: Message) => {    
    // Get current user ID from auth store
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const currentUserId = authState.state?.user?.id;
    
    // Don't skip messages sent by current user - WebSocket should deliver to both sender and receiver
    
    set((state) => {
      // Check if this message is for the current conversation
      const isCurrentConversation = state.currentConversation?.id === message.conversationId;
      
      // Add message to messages array if it doesn't already exist
      const messageExists = state.messages.some(m => m.id === message.id);
      if (messageExists) {
        return state;
      }

      const newMessages = [...state.messages, message];
      
      // Update conversations with new message
      const updatedConversations = state.conversations.map(conv => {
        if (conv.id === message.conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: conv.unreadCount + 1,
            updatedAt: new Date()
          };
        }
        return conv;
      });

      // Update current conversation if it's the active one
      const updatedCurrentConversation = isCurrentConversation && state.currentConversation
        ? { ...state.currentConversation, lastMessage: message, updatedAt: new Date() }
        : state.currentConversation;

      return {
        messages: newMessages,
        conversations: updatedConversations,
        currentConversation: updatedCurrentConversation
      };
    });
  },
}));
