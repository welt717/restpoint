FROM node:18-alpine
WORKDIR /usr/src/app
COPY services/auth-service/package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8001
ENV PORT=8001
CMD ["node", "services/auth-service/server.js"]
