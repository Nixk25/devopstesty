FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN cp prisma/schema.postgresql.prisma prisma/schema.prisma
RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
COPY prisma ./prisma/

RUN cp prisma/schema.postgresql.prisma prisma/schema.prisma
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist/

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
