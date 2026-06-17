FROM node:18-alpine
WORKDIR /usr/src/app
COPY services/notification-service/package.json ./services/notification-service/package.json
RUN cd services/notification-service && npm install --omit=dev
COPY shared/ ./shared/
COPY global/ ./global/
COPY services/utilities/ ./services/utilities/
COPY services/notification-service/ ./services/notification-service/
EXPOSE 8011
ENV PORT=8011
CMD ["node", "services/notification-service/server.js"]
