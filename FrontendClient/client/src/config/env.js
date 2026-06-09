// src/config/env.js

// Centralized configuration for the application environment

const env = {
  // Use Vite's environment variables, fallback to API Gateway on port 8000
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // Timeout for API requests in milliseconds
  API_TIMEOUT: 30000,
  
  // Feature flags could go here
  FEATURES: {
    ENABLE_ANALYTICS: true,
  }
};

export default env;
