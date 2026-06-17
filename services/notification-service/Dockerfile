FROM node:18-alpine
WORKDIR /usr/src/app
COPY services/notification-service/package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8011
ENV PORT=8011
CMD ["node", "services/notification-service/server.js"]
