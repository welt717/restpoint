FROM node:20-alpine

WORKDIR /usr/src/app

COPY services/chemical-service/package.json ./
RUN npm install --production

COPY services/chemical-service/ .
COPY shared/ ../shared/

EXPOSE 5105

CMD ["node", "server.js"]