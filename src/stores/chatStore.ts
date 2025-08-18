import { create } from 'zustand';
import { ChatState, Conversation, Message, User } from '../types';

interface ChatStore extends ChatState {
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  markMessageAsRead: (messageId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  setLoading: (loading: boolean) => void;
  createNewConversation: (participants: User[]) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string) => Promise<Message>;
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

  updateMessage: (messageId: string, updates: Partial<Message>) =>
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    })),

  markMessageAsRead: (messageId: string) =>
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
    })),

  markConversationAsRead: (conversationId: string) =>
    set((state) => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
      currentConversation: state.currentConversation?.id === conversationId
        ? { ...state.currentConversation, unreadCount: 0 }
        : state.currentConversation
    })),

  createNewConversation: async (participants: User[]) => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      participants,
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    get().addConversation(newConversation);
    return newConversation;
  },

  sendMessage: async (conversationId: string, content: string) => {
    // Get user from auth store without circular dependency
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const user = authState.state?.user;
    
    if (!user) throw new Error('User not authenticated');

    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId,
      senderId: user.id,
      content,
      timestamp: new Date(),
      isRead: false,
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    get().addMessage(newMessage);
    return newMessage;
  },
}));
