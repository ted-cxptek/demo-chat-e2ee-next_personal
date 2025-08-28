import { create } from 'zustand';
import { ChatState, Conversation, Message, User } from '../types';
import { chatGatewayAPI } from '../services/api';
import { websocketService } from '../services/websocketService';
import {
  createSenderEncryptedMessage,
  createRecipientEncryptedMessage,
  decryptEncryptedMessage
} from '../utils/crypto';

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

  addMessage: async (message: Message) => {
    try {
      // Get current user data for decryption
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const currentUser = authState.state?.user;

      let processedMessage = message;

      // Decrypt message if it's encrypted and we have the private key
      if (currentUser?.privateKey && message.isEncrypted) {
        try {
                    // Determine which content to decrypt based on current user
          const isFromCurrentUser = message.senderId === currentUser.id;
          let contentToDecrypt: string | undefined;

          if (isFromCurrentUser) {
            // Message is from current user: decrypt contentForSender
            contentToDecrypt = message.contentForSender;
          } else {
            // Message is from someone else: decrypt content
            contentToDecrypt = message.content;
          }

          if (contentToDecrypt) {
            // Decrypt and verify the EncryptedMessage
            const decryptedMessage = await decryptEncryptedMessage(contentToDecrypt, currentUser.privateKey);

            if (decryptedMessage) {

              // Update message content for display, but preserve original encrypted content for tooltips
              processedMessage = {
                ...message,
                content: decryptedMessage.content,
                contentForSender: decryptedMessage.content,
                originalContent: message.content,           // Preserve original encrypted content
                originalContentForSender: message.contentForSender  // Preserve original encrypted content
              };
            } else {
              processedMessage = {
                ...message,
                content: '❌ Failed to decrypt message',
                contentForSender: '❌ Failed to decrypt message',
                originalContent: message.content,
                originalContentForSender: message.contentForSender
              };
            }
          } else {
            // No content to decrypt
          }
        } catch (error) {
          processedMessage = {
            ...message,
            content: '❌ Error processing message',
            contentForSender: '❌ Error processing message',
            originalContent: message.content,
            originalContentForSender: message.contentForSender
          };
        }
      }

    set((state) => {
        const newMessages = [...state.messages, processedMessage];
      const updatedConversations = state.conversations.map(conv => {
          if (conv.id === processedMessage.conversationId) {
          return {
            ...conv,
              lastMessage: processedMessage,
            unreadCount: conv.unreadCount + 1,
            updatedAt: new Date()
          };
        }
        return conv;
      });

      return {
        messages: newMessages,
        conversations: updatedConversations,
          currentConversation: state.currentConversation?.id === processedMessage.conversationId
            ? { ...state.currentConversation, lastMessage: processedMessage, updatedAt: new Date() }
          : state.currentConversation
      };
    });
    } catch (error) {
      // Failed to add message
    }
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
      await get().addConversation(newConversation);
    return newConversation;
    } catch (error) {
      // Failed to create conversation
      throw error;
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      set({ isSendingMessage: true });

      // Get token and user data from auth store
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      const currentUser = authState.state?.user;

      if (!token) throw new Error('No authentication token');
      if (!currentUser?.privateKey) throw new Error('No private key available for encryption');
      if (!currentUser?.publicKey) throw new Error('No public key available for encryption');

      // Find the conversation to get recipient information and encryption flag
      const conversation = get().conversations.find(c => c.id === conversationId);
      if (!conversation) throw new Error('Conversation not found');

      const isEncrypted = conversation.isEncrypted || false;

            // Processing message

      let messageToSend: any;

      if (isEncrypted) {
        // Case 1: Encrypted message with dual encryption

        // Get recipient's public key from conversation participants
        const recipient = conversation.participants.find(p => p.id !== currentUser.id);
        if (!recipient?.publicKey) {
          throw new Error('Recipient public key not found for encryption');
        }

        // Create EncryptedMessage for sender (encrypted with sender's public key)
        const contentForSender = await createSenderEncryptedMessage(
          content,
          currentUser.publicKey,
          currentUser.privateKey
        );

        // Create EncryptedMessage for recipient (encrypted with recipient's public key)
        const contentForRecipient = await createRecipientEncryptedMessage(
      content,
          currentUser.publicKey,
          currentUser.privateKey,
          recipient.publicKey
        );

        // Created dual encrypted messages

        // Verify the encrypted data is not [object Object]
        if (contentForSender.includes('[object Object]') || contentForRecipient.includes('[object Object]')) {
          throw new Error('Encryption failed - invalid encrypted data');
        }

        // Prepare message for API
        messageToSend = {
          content: contentForRecipient,        // For recipient (encrypted with recipient's public key)
          contentForSender: contentForSender,  // For sender (encrypted with sender's public key)
          messageType: 'text',
          isEncrypted: true
        };

      } else {
        // Case 2: Raw message (no encryption)

        // Send raw message structure
        messageToSend = {
          content: content,
          contentForSender: content,  // Same as content for raw messages
          messageType: 'text',
          isEncrypted: false
        };
      }

      // Send message via API
      const newMessage = await chatGatewayAPI.sendMessage(token, conversationId, messageToSend) as Message;

      // Message sent via API

      // Normalize the message if needed (convert 'sender' to 'senderId')
      let normalizedMessage = {
        ...newMessage,
        senderId: newMessage.sender || newMessage.senderId
      };

      // Add to local store
      await get().addMessage(normalizedMessage);
      return normalizedMessage;
    } catch (error) {
      throw error;
    } finally {
      set({ isSendingMessage: false });
    }
  },

    fetchConversations: async () => {
    try {
      set({ isLoading: true });
      
      // Get token and user data from auth store
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      const currentUser = authState.state?.user;
      
      if (!token) throw new Error('No authentication token');
      
      const response = await chatGatewayAPI.getConversations(token);
      
      // Handle the API response structure
      if (response && typeof response === 'object' && 'conversations' in response) {
        const conversations = response.conversations || [];
        
        // Decrypt lastMessage in each conversation if it's encrypted
        const decryptedConversations = await Promise.all(conversations.map(async (conv: any) => {
          if (conv.lastMessage && conv.lastMessage.isEncrypted && currentUser?.privateKey) {
            try {
              // Decrypting lastMessage in conversation
              const lastMessage = {
                ...conv.lastMessage,
                senderId: conv.lastMessage.senderId || conv.lastMessage.sender
              };
              
              // Determine which content to decrypt based on current user
              const isFromCurrentUser = lastMessage.senderId === currentUser.id;
              let contentToDecrypt: string | undefined;
              
              if (isFromCurrentUser) {
                // Message is from current user: decrypt contentForSender
                contentToDecrypt = conv.lastMessage.contentForSender;
              } else {
                // Message is from someone else: decrypt content
                contentToDecrypt = conv.lastMessage.content;
              }
              
              if (contentToDecrypt) {
                // Decrypt and verify the EncryptedMessage
                const decryptedMessage = await decryptEncryptedMessage(contentToDecrypt, currentUser.privateKey);
                
                if (decryptedMessage) {
                  // Successfully decrypted lastMessage
                  
                  // Update conversation with decrypted lastMessage, but preserve original encrypted content for tooltips
                  return {
                    ...conv,
                    lastMessage: {
                      ...conv.lastMessage,
                      content: decryptedMessage.content,
                      contentForSender: decryptedMessage.content,
                      originalContent: conv.lastMessage.content,           // Preserve original encrypted content
                      originalContentForSender: conv.lastMessage.contentForSender  // Preserve original encrypted content
                    }
                  };
                } else {
                  return {
                    ...conv,
                    lastMessage: {
                      ...conv.lastMessage,
                      content: '❌ Failed to decrypt message',
                      contentForSender: '❌ Failed to decrypt message',
                      originalContent: conv.lastMessage.content,
                      originalContentForSender: conv.lastMessage.contentForSender
                    }
                  };
                }
              } else {
                return conv;
              }
            } catch (error) {
              return {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  content: '❌ Error processing message',
                  contentForSender: '❌ Error processing message',
                  originalContent: conv.lastMessage.content,
                  originalContentForSender: conv.lastMessage.contentForSender
                }
              };
            }
          }
          
          // Return conversation unchanged if no decryption needed
          return conv;
        }));
        
        set({ conversations: decryptedConversations, isLoading: false });
      } else {
        // Fallback if response structure is different
        const conversations = Array.isArray(response) ? response : [];
        set({ conversations, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      // Get token and user data from auth store
      const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const token = authState.state?.token;
      const currentUser = authState.state?.user;

      if (!token) throw new Error('No authentication token');

      const response = await chatGatewayAPI.getMessages(token, conversationId);

      // Handle the API response structure
      if (response && typeof response === 'object' && 'messages' in response) {
        const messages = response.messages || [];

        // Normalize and decrypt messages if needed
        const normalizedMessages = await Promise.all(messages.map(async (msg: any) => {
          let normalizedMsg = {
            ...msg,
            senderId: msg.sender || msg.senderId
          };

          // Decrypt message if it's encrypted and we have the private key
          if (currentUser?.privateKey && msg.isEncrypted) {
            try {
              // Decrypting fetched message

              // Determine which content to decrypt based on current user
              const isFromCurrentUser = normalizedMsg.senderId === currentUser.id;
              let contentToDecrypt: string | undefined;

              if (isFromCurrentUser) {
                // Message is from current user: decrypt contentForSender
                contentToDecrypt = normalizedMsg.contentForSender;
              } else {
                // Message is from someone else: decrypt content
                contentToDecrypt = normalizedMsg.content;
              }

              if (contentToDecrypt) {
                // Decrypt and verify the EncryptedMessage
                const decryptedMessage = await decryptEncryptedMessage(contentToDecrypt, currentUser.privateKey);

                if (decryptedMessage) {
                  // Successfully decrypted fetched message

                  // Update message content for display, but preserve original encrypted content for tooltips
                  normalizedMsg = {
                    ...normalizedMsg,
                    content: decryptedMessage.content,
                    contentForSender: decryptedMessage.content,
                    originalContent: msg.content,           // Preserve original encrypted content
                    originalContentForSender: msg.contentForSender  // Preserve original encrypted content
                  };
                } else {
                  normalizedMsg = {
                    ...normalizedMsg,
                    content: '❌ Failed to decrypt message',
                    contentForSender: '❌ Failed to decrypt message',
                    originalContent: msg.content,
                    originalContentForSender: msg.contentForSender
                  };
                }
              } else {
                // No content to decrypt for message
              }
            } catch (error) {
              normalizedMsg = {
                ...normalizedMsg,
                content: '❌ Error processing message',
                contentForSender: '❌ Error processing message',
                originalContent: msg.content,
                originalContentForSender: msg.contentForSender
              };
            }
          }

          return normalizedMsg;
        }));

        // Update messages and also update conversations with decrypted lastMessage
        set((state) => {
          // Find the latest message for this conversation
          const latestMessage = normalizedMessages.length > 0 ?
            normalizedMessages[normalizedMessages.length - 1] : null;

          // Updating conversations with decrypted lastMessage

          // Update conversations to include decrypted lastMessage
          const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId && latestMessage) {
              // Updating conversation

              return {
                ...conv,
                lastMessage: latestMessage,
                updatedAt: new Date()
              };
            }
            return conv;
          });

          return {
            messages: normalizedMessages,
            conversations: updatedConversations,
            isLoading: false
          };
        });
      } else {
        // Fallback if response structure is different
        const messages = Array.isArray(response) ? response : [];
        set({ messages, isLoading: false });
      }
    } catch (error) {
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
        return;
      }

      if (!user) {
        return;
      }

      // Set up message handler for incoming messages
      websocketService.onMessage(get().handleIncomingMessage);

      // Connect to WebSocket with user ID for automatic login
      websocketService.connect(token, user.username);

    } catch (error) {
      // Failed to connect WebSocket
    }
  },

  disconnectWebSocket: () => {
    try {
      websocketService.disconnect();
    } catch (error) {
      // Failed to disconnect WebSocket
    }
  },

  handleIncomingMessage: async (message: Message) => {
    // Get current user ID and private key from auth store
    const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    const currentUserId = authState.state?.user?.id;
    const currentUserPrivateKey = authState.state?.user?.privateKey;

    // Don't skip messages sent by current user - WebSocket should deliver to both sender and receiver

    // Process incoming message (decrypt if encrypted)
    let processedMessage = message;

    if (message.isEncrypted && currentUserPrivateKey) {
      try {
        // Determine which content to decrypt based on current user
        const isFromCurrentUser = message.senderId === currentUserId;
        let contentToDecrypt: string | undefined;

        if (isFromCurrentUser) {
          // Message is from current user: decrypt contentForSender
          contentToDecrypt = message.contentForSender;
        } else {
          // Message is from someone else: decrypt content
          contentToDecrypt = message.content;
        }

        if (contentToDecrypt) {
          // Decrypt and verify the EncryptedMessage
          const decryptedMessage = await decryptEncryptedMessage(contentToDecrypt, currentUserPrivateKey);

          if (decryptedMessage) {
            // Update message content for display, but preserve original encrypted content for tooltips
            processedMessage = {
              ...message,
              content: decryptedMessage.content,
              contentForSender: decryptedMessage.content,
              originalContent: message.content,           // Preserve original encrypted content
              originalContentForSender: message.contentForSender  // Preserve original encrypted content
            };
          } else {
            processedMessage = {
              ...message,
              content: '❌ Failed to decrypt message',
              contentForSender: '❌ Failed to decrypt message',
              originalContent: message.content,
              originalContentForSender: message.contentForSender
            };
          }
        }
      } catch (error) {
        processedMessage = {
          ...message,
          content: '❌ Error processing message',
          contentForSender: '❌ Error processing message',
          originalContent: message.content,
          originalContentForSender: message.contentForSender
        };
      }
    }

    set((state) => {
      // Check if this message is for the current conversation
      const isCurrentConversation = state.currentConversation?.id === processedMessage.conversationId;

      // Add message to messages array if it doesn't already exist
      const messageExists = state.messages.some(m => m.id === processedMessage.id);
      if (messageExists) {
        return state;
      }

      const newMessages = [...state.messages, processedMessage];

      // Update conversations with new message
      const updatedConversations = state.conversations.map(conv => {
        if (conv.id === processedMessage.conversationId) {
          return {
            ...conv,
            lastMessage: processedMessage,
            unreadCount: conv.unreadCount + 1,
            updatedAt: new Date()
          };
        }
        return conv;
      });

      // Update current conversation if it's the active one
      const updatedCurrentConversation = isCurrentConversation && state.currentConversation
        ? { ...state.currentConversation, lastMessage: processedMessage, updatedAt: new Date() }
        : state.currentConversation;

      return {
        messages: newMessages,
        conversations: updatedConversations,
        currentConversation: updatedCurrentConversation
      };
    });
  },
}));
