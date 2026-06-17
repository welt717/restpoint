FROM node:22-alpine
WORKDIR /usr/src/app

COPY services/mpesa-service/package.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 10 && \
    npm install --omit=dev

COPY . .

EXPOSE 8007
ENV PORT=8007
CMD ["node", "services/mpesa-service/server.js"]
