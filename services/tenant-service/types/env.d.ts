declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    
    // Master Database
    MASTER_DB_HOST: string;
    MASTER_DB_PORT: string;
    MASTER_DB_USER: string;
    MASTER_DB_PASSWORD: string;
    MASTER_DB_NAME: string;
    
    // JWT
    JWT_SECRET: string;
    REFRESH_SECRET: string;
    
    // CORS
    CORS_ORIGIN: string;
  }
}