FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy workspace-level tsconfig.base.json (referenced by tsconfig.json extends ../../tsconfig.base.json)
COPY tsconfig.base.json /tsconfig.base.json

COPY services/calender-service/package.json services/calender-service/tsconfig.json ./
RUN npm install

COPY services/calender-service/ .
RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 8104

ENV NODE_ENV=production
ENV PORT=8104

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8104/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]