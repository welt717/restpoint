FROM node:20-alpine

WORKDIR /usr/src/app

COPY services/call-service/package.json ./
RUN npm install --production

COPY services/call-service/ .

EXPOSE 8120

CMD ["node", "server.js"]
