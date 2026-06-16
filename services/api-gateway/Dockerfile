# ============================================
# RestPoint Gateway — Multi-stage Docker Build
# ============================================

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json yarn.lock ./
COPY services/api-gateway/package.json ./services/api-gateway/

# Copy tsconfig
COPY tsconfig.json tsconfig.base.json ./
COPY services/api-gateway/tsconfig.json ./services/api-gateway/

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY services/api-gateway/ ./services/api-gateway/

# Build
RUN cd services/api-gateway && npx tsc

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy production dependencies
COPY package.json yarn.lock ./
COPY services/api-gateway/package.json ./services/api-gateway/

# Install only production dependencies
RUN yarn install --frozen-lockfile --production=true

# Copy built artifacts from builder
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist

# Copy env
COPY .env ./

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "services/api-gateway/dist/server.js"]