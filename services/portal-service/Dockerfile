FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY services/portal-service/package.json ./services/portal-service/package.json
RUN cd services/portal-service && npm install --production

# Copy shared modules (needed for database config)
COPY shared/ ./shared/
COPY global/ ./global/
COPY configurations/ ./configurations/
COPY packages/ ./packages/

# Copy service source code
COPY services/portal-service/ ./services/portal-service/

EXPOSE 5019
ENV PORT=5019

CMD ["node", "services/portal-service/server.js"]
