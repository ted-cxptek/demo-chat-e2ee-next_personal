export interface User {
  id: string;
  username: string;
  publicKey: string;
  createdAt: string;
  seedPhrase?: string; // Seed phrase for demo purposes
}

export interface Message {
  id: string;
  conversationId: string;
  sender?: string; // Primary field for sender ID (used by Fetch Messages)
  senderId: string; // Primary field for sender ID (used by WebSocket)
  // Note: API responses might use 'sender' instead of 'senderId'
  // The chatStore normalizes 'sender' to 'senderId' for consistency
  receiverId?: string; // Added to match WebSocket message
  content: string;
  contentForSender?: string; // Added to match WebSocket message
  messageType: 'text' | 'image' | 'file'; // Added to match WebSocket message
  isEncrypted: boolean; // Added to match WebSocket message
  status?: 'sent' | 'delivered' | 'read'; // Made optional as it's not in WebSocket message
  createdAt: string; // Changed from Date to string to match WebSocket message
  updatedAt?: string; // Made optional as it's not in WebSocket message
  // Removed timestamp and isRead as they don't exist in WebSocket message
}

export interface Conversation {
  id: string;
  name?: string | null;
  type: 'direct' | 'group';
  isEncrypted: boolean;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
  seedPhrase: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  seedPhrase: string;
  publicKey: string;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSendingMessage: boolean;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addConversation: (conversation: Conversation) => void;
  addMessage: (message: Message) => void;
  createNewConversation: (receiverUsername: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string) => Promise<Message>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'user_online' | 'user_offline';
  data: Record<string, unknown>;
}

// API Response Types
export interface ChatApiResponse<T> {
  success: boolean;
  data?: T & { error?: string; message?: string };
  statusCode: number;
}

export interface GatewayApiResponse {
  success: boolean;
  data?: string; // stringified ChatApiResponse<T>
  error?: string;
  message?: string;
  statusCode?: number;
}


// Chat API Response Types
export type LoginResponse = {
  user: User;
  token: string;
};

export type RegisterResponse = {
  user: User;
  token: string;
};

export type ConversationResponse = {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type MessageResponse = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
};

// API Response for conversations list
export type ConversationsResponse = {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
};

// API Response for messages list
export type MessagesResponse = {
  messages: Message[];
  total: number;
  limit: number;
  offset: number;
};

export type UserSearchResponse = {
  users: User[];
  total: number;
};
