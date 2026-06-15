# Production Dockerfile for Tenant Service
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage - Use same Node version as builder
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /usr/src/app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/scripts ./scripts
COPY --from=builder /usr/src/app/config ./config

# Create uploads directory
RUN mkdir -p /usr/src/app/uploads && chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port - Match docker-compose expected port
EXPOSE 5002

# Set environment
ENV NODE_ENV=production
ENV PORT=5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5002/health || exit 1

# Start application with dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]