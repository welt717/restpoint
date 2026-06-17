FROM node:18-alpine
WORKDIR /usr/src/app
COPY services/coffin-service/package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8008
ENV PORT=8008
CMD ["node", "services/coffin-service/server.js"]
