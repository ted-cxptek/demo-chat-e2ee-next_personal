import { LoginCredentials, RegisterCredentials, LoginResponse, RegisterResponse, ConversationsResponse, MessagesResponse } from '../types';
import { axiosInstance, CHAT_SERVER_CONFIG } from '../constants';

class ApiError extends Error {
  constructor(
    message: string,
    public code?: number | string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: any): ApiError {
    return new ApiError(
      response?.data?.message || response?.message || 'Unknown error occurred', 
      response?.status?.toString() || response?.statusCode?.toString() || '500'
    );
  }
}

// ChatAPI - sends direct HTTP requests to chat server
export class ChatAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = CHAT_SERVER_CONFIG.baseURL;
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        ...(data && method !== 'GET' ? { data } : {}),
        ...(method === 'GET' && data ? { params: data } : {}),
        timeout: CHAT_SERVER_CONFIG.timeout,
      };

      const response = await axiosInstance(config);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Server responded with error status
        throw ApiError.fromResponse(error.response);
      } else if (error.request) {
        // Request was made but no response received
        throw new ApiError('No response from server', '0');
      } else {
        // Something else happened
        throw new ApiError(error.message || 'Request failed', '0');
      }
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>('POST', '/v1/auth/login', credentials);
  }

  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    return this.makeRequest<RegisterResponse>('POST', '/v1/auth/register', credentials);
  }

  // Chat endpoints
  async createConversation(token: string, receiverUsername: string, isEncrypted: boolean = true) {
    const data = {
      receiverUsername,
      isEncrypted,
    };
    return this.makeRequest('POST', '/v1/chat/conversations', data, {
      'Authorization': `Bearer ${token}`
    });
  }

  async getConversations(token: string): Promise<ConversationsResponse> {
    return this.makeRequest<ConversationsResponse>('GET', '/v1/chat/conversations', {}, {
      'Authorization': `Bearer ${token}`
    });
  }

  async sendMessage(token: string, conversationId: string, messageData: {
    content: string;
    contentForSender: string;
    messageType: string;
    isEncrypted: boolean;
  }) {
    const data = {
      conversationId,
      ...messageData,
    };
    return this.makeRequest('POST', '/v1/chat/messages', data, {
      'Authorization': `Bearer ${token}`
    });
  }

  async getMessages(token: string, conversationId: string): Promise<MessagesResponse> {
    return this.makeRequest<MessagesResponse>('GET', `/v1/chat/conversations/${conversationId}/messages`, {}, {
      'Authorization': `Bearer ${token}`
    });
  }

  // User endpoints
  async searchUsers(token: string, query: string) {
    return this.makeRequest('GET', '/v1/users/search', { q: query }, {
      'Authorization': `Bearer ${token}`
    });
  }

  async getUserProfile(token: string, userId: string) {
    return this.makeRequest('GET', `/v1/users/${userId}/profile`, {}, {
      'Authorization': `Bearer ${token}`
    });
  }
}

// Export singleton instance
export const chatAPI = new ChatAPI();
export { ApiError };
