FROM node:22-alpine
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY services/marketplace-service/package.json ./services/marketplace-service/package.json
RUN cd services/marketplace-service && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 10 && \
    npm install --omit=dev

# Copy service source code
COPY services/marketplace-service/ ./services/marketplace-service/

EXPOSE 8010
ENV PORT=8010
CMD ["node", "services/marketplace-service/server.js"]