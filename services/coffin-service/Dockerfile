FROM node:18-alpine

WORKDIR /usr/src/app

# Install tsx globally for TypeScript execution
RUN npm install -g tsx typescript

# Copy package.json and install dependencies
COPY services/coffin-service/package.json ./services/coffin-service/package.json
RUN cd services/coffin-service && npm install --omit=dev

# Copy shared modules (needed by @montezuma/shared-config)
COPY shared/ ./shared/
COPY global/ ./global/
COPY services/utilities/ ./services/utilities/
COPY packages/shared-config/ ./packages/shared-config/
COPY packages/shared-logger/ ./packages/shared-logger/
COPY packages/shared-utils/ ./packages/shared-utils/
COPY packages/shared-services/ ./packages/shared-services/

# Build shared-config if needed
RUN cd packages/shared-config && npx tsc --project tsconfig.json 2>/dev/null || echo "tsc not available, will use JS fallback"

# Copy service source code
COPY services/coffin-service/ ./services/coffin-service/

# Copy startup script
COPY scripts/docker-startup.sh ./scripts/docker-startup.sh
RUN chmod +x ./scripts/docker-startup.sh

EXPOSE 8008
ENV PORT=8008

ENTRYPOINT ["/usr/src/app/scripts/docker-startup.sh"]
CMD ["node", "services/coffin-service/server.js"]