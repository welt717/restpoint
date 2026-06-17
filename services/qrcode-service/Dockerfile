FROM node:22-alpine
WORKDIR /usr/src/app

COPY services/qrcode-service/package.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 10 && \
    npm install --omit=dev

COPY . .

EXPOSE 8012
ENV PORT=8012
CMD ["node", "services/qrcode-service/server.js"]
