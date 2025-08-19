import { LoginCredentials, RegisterCredentials, LoginResponse, RegisterResponse, GatewayApiResponse, ChatApiResponse, ConversationsResponse, MessagesResponse } from '../types';
import { OnionPayload, OnionResponse } from 'onion-request-lib';
import { onionBuilder, GATEWAY_CONFIG, API_CONFIG } from '../constants';

class ApiError extends Error {
  constructor(
    message: string,
    public code?: number | string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  // Helper method to create ApiError from onion response
  static fromGatewayResponse(response: GatewayApiResponse): ApiError {
    return new ApiError(response.message || 'Unknown error occurred', response.statusCode?.toString() || '500');
  }

  static fromChatResponse(response: ChatApiResponse<any>): ApiError {
    return new ApiError(response.data?.message || 'Unknown error occurred', response.statusCode?.toString() || '500');
  }

}

// Define the payload type structure to match utils.ts
type Payload = { 
    method: string, 
    endpoint: string,
    params: Record<string, unknown>,
    body: Record<string, unknown>,
    query: Record<string, unknown>,
    headers?: Record<string, string>
}

// ChatGatewayBuilder - builds request parameters for onion routing
export class ChatGatewayBuilder {
  static getLoginPayload(username: string, password: string): OnionPayload<Payload> {
    const payload: Payload = {
      method: 'POST',
      endpoint: '/v1/auth/login',
      params: {},
      body: {
        username,
        password,
      },
      query: {}
    };
    return payload;
  }

  static getRegisterPayload(username: string, password: string, publicKey: string): OnionPayload<Payload> {
    const payload: Payload = {
      method: 'POST',
      endpoint: '/v1/auth/register',
      params: {},
      body: {
        username,
        password,
        publicKey
      },
      query: {}
    };
    return payload;
  }

  static getCreateConversationPayload(receiverUsername: string, isEncrypted: boolean = true): OnionPayload<Payload> {
    const payload: Payload = {
      method: 'POST',
      endpoint: '/v1/chat/conversations',
      params: {},
      body: {
        receiverUsername,
        isEncrypted,
      },
      query: {}
    };
    return payload;
  }

  static getSendMessagePayload(conversationId: string, content: string): OnionPayload<Payload> {
    const payload: Payload = {
      method: 'POST',
      endpoint: '/v1/chat/messages',
      params: {},
      body: {
        conversationId,
        content,
      },
      query: {}
    };
    return payload;
  }

  static getGetConversationsPayload(): OnionPayload<Payload> {
    const payload: Payload = {
      method: 'GET',
      endpoint: '/v1/chat/conversations',
      params: {},
      body: {},
      query: {}
    };
    return payload;
  }

  static getGetMessagesPayload(conversationId: string): OnionPayload<Payload> {
    const payload: Payload = {
      method: 'GET',
      endpoint: `/v1/chat/conversations/${conversationId}/messages`,
      params: {},
      body: {},
      query: {}
    };
    return payload;
  }

  static getUserSearchPayload(query: string): OnionPayload<Payload> {
    const payload: Payload = {
      method: 'GET',
      endpoint: '/v1/users/search',
      params: {},
      body: {},
      query: { q: query }
    };
    return payload;
  }

  static getUserProfilePayload(userId: string): OnionPayload<Payload> {
    const payload: Payload = {
      method: 'GET',
      endpoint: `/v1/users/${userId}/profile`,
      params: {},
      body: {},
      query: {}
    };
    return payload;
  }
}

// Type guard to check if response data contains an error
const hasError = (data: any): data is { error: string; message?: string; statusCode: number; code?: string } => {
  return data && typeof data === 'object' && 'error' in data;
};

// Utility function to parse onion response and extract data
const parseOnionResponse = <T>(response: string): T => {
  try {
    // First, parse the outer response body
    const parsedResponse = JSON.parse(response) as GatewayApiResponse;
    
    // Check for errors in the parsed nested data
    if (hasError(parsedResponse)) {
      throw ApiError.fromGatewayResponse(parsedResponse);
    }

    const parseChatResponse = JSON.parse(parsedResponse.data || '{}') as ChatApiResponse<T>;
    if (hasError(parseChatResponse.data)) {
      throw ApiError.fromChatResponse(parseChatResponse);
    }
    
    return parseChatResponse.data as T;
  } catch (parseError) {
    if (parseError instanceof ApiError) {
      throw parseError;
    }
    throw new ApiError('Invalid JSON response from server', '500');
  }
};

// ChatGatewayAPI - sends requests through onion routing
export class ChatGatewayAPI {
  constructor() { }

  private async sendOnionRequest<T>(payload: OnionPayload<Payload>): Promise<T> {
    try {
      const response = await onionBuilder.sendOnionRequest(payload, GATEWAY_CONFIG);
      
      if (response.statusCode >= 400) {
        throw new ApiError(
          `HTTP ${response.statusCode}: Request failed`,
          response.statusCode.toString()
        );
      }

      // Use utility function to parse the onion response
      return parseOnionResponse(response.body); // return GatewayApiResponse<T>
      
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Onion request failed',
        0
      );
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const payload = ChatGatewayBuilder.getLoginPayload(credentials.username, credentials.password);
    return this.sendOnionRequest<LoginResponse>(payload);
  }

  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    const payload = ChatGatewayBuilder.getRegisterPayload(credentials.username, credentials.password, credentials.publicKey);
    return this.sendOnionRequest<RegisterResponse>(payload);
  }

  // Chat endpoints
  async createConversation(token: string, receiverUsername: string, isEncrypted: boolean = true) {
    const payload = ChatGatewayBuilder.getCreateConversationPayload(receiverUsername, isEncrypted);
    // Add auth token to payload headers
    const payloadWithToken: Payload = {
      ...payload,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    return this.sendOnionRequest(payloadWithToken);
  }

  async getConversations(token: string): Promise<ConversationsResponse> {
    const payload = ChatGatewayBuilder.getGetConversationsPayload();
    // Add auth token to payload headers
    const payloadWithToken: Payload = {
      ...payload,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    return this.sendOnionRequest<ConversationsResponse>(payloadWithToken);
  }

  async sendMessage(token: string, conversationId: string, content: string) {
    const payload = ChatGatewayBuilder.getSendMessagePayload(conversationId, content);
    // Add auth token to payload headers
    const payloadWithToken: Payload = {
      ...payload,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    return this.sendOnionRequest(payloadWithToken);
  }

  async getMessages(token: string, conversationId: string): Promise<MessagesResponse> {
    const payload = ChatGatewayBuilder.getGetMessagesPayload(conversationId);
    // Add auth token to payload headers
    const payloadWithToken: Payload = {
      ...payload,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    return this.sendOnionRequest<MessagesResponse>(payloadWithToken);
  }

  // User endpoints
  async searchUsers(token: string, query: string) {
    const payload = ChatGatewayBuilder.getUserSearchPayload(query);
    // Add auth token to payload headers
    const payloadWithToken: Payload = {
      ...payload,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    return this.sendOnionRequest(payloadWithToken);
  }

  async getUserProfile(token: string, userId: string) {
    const payload = ChatGatewayBuilder.getUserProfilePayload(userId);
    // Add auth token to payload headers
    const payloadWithToken: Payload = {
      ...payload,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    return this.sendOnionRequest(payloadWithToken);
  }
}

// Export singleton instance
export const chatGatewayAPI = new ChatGatewayAPI();
export { ApiError };
