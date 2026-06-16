FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8010
ENV PORT=8010
CMD ["node", "services/visitors-service/server.js"]
