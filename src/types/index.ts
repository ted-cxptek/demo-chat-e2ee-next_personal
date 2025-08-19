export interface User {
  id: string;
  username: string;
  publicKey: string;
  seedPhrase?: string; // Optional for backward compatibility
  derivedPublicKey?: string; // The actual public key derived from seed phrase
  createdAt: Date;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: string; // Changed from senderId to match API
  receiverId?: string; // Added to match API
  content: string;
  contentForSender?: string; // Added to match API
  messageType: 'text' | 'image' | 'file'; // Added to match API
  isEncrypted: boolean; // Added to match API
  status: 'sent' | 'delivered' | 'read'; // Added to match API
  createdAt: string; // Changed from Date to string to match API
  updatedAt: string; // Added to match API
  // Removed timestamp and isRead as they don't exist in API
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
  confirmPassword: string;
  seedPhrase: string;
  derivedPublicKey: string;
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
