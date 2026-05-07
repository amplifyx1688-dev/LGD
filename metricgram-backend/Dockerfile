# Dockerfile for Metricgram Backend

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY metricgram-shared-types/package*.json ./metricgram-shared-types/

# 安裝共享類型包
WORKDIR /app/metricgram-shared-types
RUN npm ci --only=production

# 安裝後端依賴
WORKDIR /app
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/metricgram-shared-types ./metricgram-shared-types
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 構建 TypeScript
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 創建非 root 用戶
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# 複製必要文件
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/metricgram-shared-types ./metricgram-shared-types
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/logs ./logs

# 創建上傳目錄
RUN mkdir -p uploads

# 調整權限
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

CMD ["node", "dist/server.js"]
