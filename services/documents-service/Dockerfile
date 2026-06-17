FROM node:18-alpine
WORKDIR /usr/src/app
COPY services/documents-service/package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8012
ENV PORT=8012
CMD ["node", "services/documents-service/server.js"]
