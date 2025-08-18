export interface User {
  id: string;
  username: string;
  publicKey: string;
  createdAt: Date;
  lastSeen?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  encryptedContent?: string;
}

export interface Conversation {
  id: string;
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
}

export interface RegisterCredentials {
  username: string;
  password: string;
  confirmPassword: string;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
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

export type UserSearchResponse = {
  users: User[];
  total: number;
};
