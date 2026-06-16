FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5017
ENV PORT=5017
CMD ["node", "services/updates/sendNotificationUpdates.js"]
