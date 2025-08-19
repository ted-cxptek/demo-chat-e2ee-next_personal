import { create } from 'zustand';
import { ChatState, Conversation, Message, User } from '../types';
import { chatGatewayAPI } from '../services/api';

interface ChatStore extends ChatState {
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  createNewConversation: (receiverUsername: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string) => Promise<Message>;
  fetchConversations: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,

  setLoading: (loading: boolean) => set({ isLoading: loading }),

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
      // Get token from auth store
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      
      if (!token) throw new Error('No authentication token');
      
      // Send message via API
      const newMessage = await chatGatewayAPI.sendMessage(token, conversationId, content) as Message;
      
      // Add to local store
      get().addMessage(newMessage);
      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
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
}));
