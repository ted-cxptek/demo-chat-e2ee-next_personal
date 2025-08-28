import axios from 'axios';

export const OXEN_SEED_NODES = [
    'http://seed1.getsession.org/json_rpc',
    'http://seed2.getsession.org/json_rpc',
    'http://seed3.getsession.org/json_rpc'
] as const;

// Create browser-compatible axios instance
const axiosInstance = axios.create({
  timeout: 10000,
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error:', error);
    return Promise.reject(error);
  }
);

// Export axios instance for direct API calls
export { axiosInstance };

// Chat server configuration for direct HTTP requests
export const CHAT_SERVER_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:4000',
    timeout: 10000,
};

// API configuration
export const API_CONFIG = {
    timeout: 10000,
};
