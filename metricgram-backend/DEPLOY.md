# Metricgram 系統部署指南

## 🚀 **一鍵部署命令（Production）**

```bash
# 1. 克隆項目
git clone <your-repo>
cd TelegramWEB/metricgram-backend

# 2. 安裝依賴
npm ci --only=production

# 3. 配置環境變數
cp .env.example .env
# 編輯 .env，填入真實 Token 和密鑰

# 4. 構建
npm run build

# 5. 啟動（使用 PM2 推薦）
npm install -g pm2
pm2 start dist/server.js --name metricgram-api
pm2 start dist/bot.js --name metricgram-bot

# 6. 查看狀態
pm2 status
pm2 logs
```

---

## 🐳 **Docker 部署（推薦）**

```bash
# 1. 構建鏡像
docker build -t metricgram-backend .

# 2. 運行容器
docker run -d \
  --name metricgram-api \
  -p 3001:3001 \
  --env-file .env \
  --restart unless-stopped \
  metricgram-backend

# 3. 查看日誌
docker logs -f metricgram-api
```

---

## ☁️ **雲端部署**

### **Railway（最简单）**
```bash
# 1. 登入 Railway
npm i -g railway

# 2. 初始化項目
railway login
railway init

# 3. 添加 PostgreSQL
railway add postgresql

# 4. 設置環境變數（在 Railway Dashboard 配置：
# BOT_TOKEN, JWT_SECRET, DATABASE_URL 等）

# 5. 部署
railway up
```

### **Vercel（仅API）**
```bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 部署
vercel --prod

# 3. 配置環境變數（在 Vercel Dashboard）
```

---

## 📊 **數據庫遷移**

```bash
# 開發環境：生成 Prisma Client
npx prisma generate

# 創建遷移文件
npx prisma migrate dev --name init

# 生產環境：執行遷移
npx prisma migrate deploy

# 重置數據庫（危險！）
npx prisma migrate reset
```

---

## 🔐 **安全配置**

### **必須修改的配置**

```bash
# .env（Production）
JWT_SECRET=<隨機生成 64 字符>
BOT_TOKEN=<Telegram Bot Token>
DATABASE_URL=postgresql://user:pass@host:5432/metricgram

# 生成安全 JWT Secret
openssl rand -base64 48
```

---

## 📈 **監控與維護**

### **PM2 命令**
```bash
# 監控進程
pm2 monit

# 查看日誌
pm2 logs metricgram-api
pm2 logs metricgram-bot

# 重啟
pm2 restart all

# 設置開機自啟
pm2 save
pm2 startup
```

### **數據庫備份**
```bash
# 每日自動備份（Cron）
0 2 * * * pg_dump metricgram > /backups/metricgram-$(date +%Y%m%d).sql
```

---

## 🆘 **故障排查**

| 問題 | 檢查點 | 解決方案 |
|------|--------|---------|
| Bot 不響應 | 檢查 Token/Bot 狀態 | 重新 setWebhook 或啟動輪詢 |
| API 502 | 檢查端口 | `netstat -tlnp` |
| 數據庫連線失敗 | 檢查 DATABASE_URL | 確認密码和IP |
| UTF-8 亂碼 | 檢查文件編碼 | 所有文件轉 UTF-8 |

---

## 📞 **技术支持**

如有問題，請查閱：
- `README.md` - 項目說明
- `FRONTEND_INTEGRATION.md` - 前端對接
- Prisma 文檔：https://prisma.io/docs
