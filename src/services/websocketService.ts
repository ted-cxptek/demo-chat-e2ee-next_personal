'use client';

import { Message } from '../types';
import { WEBSOCKET_CONFIG } from '../constants';

type WebSocketMessageHandler = (message: Message) => void;
type WebSocketStatusHandler = (status: 'connected' | 'disconnected' | 'error') => void;
type WebSocketOpenHandler = () => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: WebSocketMessageHandler[] = [];
  private statusHandlers: WebSocketStatusHandler[] = [];
  private openHandlers: WebSocketOpenHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private pendingLogin: { userId: string; token: string } | null = null;

  constructor() {
    this.handleMessage = this.handleMessage.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  connect(token: string, userId?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // Store login credentials for automatic login after connection
      if (userId) {
        this.pendingLogin = { userId, token };
      }
      
      // Connect to WebSocket with token as query parameter
      const wsUrl = `${WEBSOCKET_CONFIG.baseURL}${WEBSOCKET_CONFIG.path}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen;
      this.ws.onmessage = this.handleMessage;
      this.ws.onclose = this.handleClose;
      this.ws.onerror = this.handleError;

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.notifyStatus('error');
    }
  }

  // Send login message to WebSocket server after connection
  login(userId: string, token: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const loginMessage = {
        id: userId,
        method: "login",
        params: [token]
      };
      
      this.ws.send(JSON.stringify(loginMessage));
    } else {
      console.error('Cannot send login message: WebSocket not connected');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.notifyStatus('disconnected');
  }

  private handleOpen(): void {
    console.log('WebSocket connected successfully');
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.notifyStatus('connected');
    this.notifyOpen(); // Notify open handlers

    // Attempt to send login message if pending
    if (this.pendingLogin) {
      this.login(this.pendingLogin.userId, this.pendingLogin.token);
      this.pendingLogin = null; // Clear pending login after sending
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Check if the message has the expected structure
      if (this.isValidMessage(data)) {
        const message: Message = data;
        this.notifyMessageHandlers(message);
      } else {
        console.warn('Received invalid message format:', data);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.notifyStatus('disconnected');

    // Attempt to reconnect if not manually closed
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private handleError(error: Event): void {
    this.notifyStatus('error');
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Get token from localStorage for reconnection
        const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
        const token = authState.state?.token;
        
        if (token) {
          this.connect(token);
        }
      }
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  private isValidMessage(data: any): data is Message {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.conversationId === 'string' &&
      typeof data.senderId === 'string' && // Changed from sender to senderId
      typeof data.content === 'string' &&
      typeof data.createdAt === 'string'
      // Note: receiverId, contentForSender, messageType, isEncrypted are optional
    );
  }

  // Message handling
  onMessage(handler: WebSocketMessageHandler): void {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: WebSocketMessageHandler): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  private notifyMessageHandlers(message: Message): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  // Status handling
  onStatusChange(handler: WebSocketStatusHandler): void {
    this.statusHandlers.push(handler);
  }

  removeStatusHandler(handler: WebSocketStatusHandler): void {
    const index = this.statusHandlers.indexOf(handler);
    if (index > -1) {
      this.statusHandlers.splice(index, 1);
    }
  }

  private notifyStatus(status: 'connected' | 'disconnected' | 'error'): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  // Open event handling
  onOpen(handler: WebSocketOpenHandler): void {
    this.openHandlers.push(handler);
  }

  removeOpenHandler(handler: WebSocketOpenHandler): void {
    const index = this.openHandlers.indexOf(handler);
    if (index > -1) {
      this.openHandlers.splice(index, 1);
    }
  }

  private notifyOpen(): void {
    this.openHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('Error in open handler:', error);
      }
    });
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' | 'error' {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'disconnected';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default WebSocketService;
