FROM node:18-alpine
WORKDIR /usr/src/app
COPY services/invoice-service/package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8006
ENV PORT=8006
CMD ["node", "services/invoice-service/server.js"]
