# 🚀 Metricgram 後端系統 - 快速開始

## ⚡ **3 分鐘啟動（前提條件）**

### **必需軟件**
- [Node.js](https://nodejs.org/) ≥ 20.0.0
- [Docker Desktop](https://www.docker.com/products/docker-desktop) （ PostgreSQL + Redis ）
- Git（可選）

---

## 📦 **安裝步驟**

### **Step 1：安裝依賴**

```bash
# 進入後端目錄
cd metricgram-backend

# 安裝 npm 依賴
npm install

# 安裝共享類型包
cd ../metricgram-shared-types
npm install && npm run build
cd ../metricgram-backend
```

### **Step 2：配置環境變數**

```bash
# 複製模板
cp .env.example .env

# 編輯 .env（使用文本編輯器）
# 至少填寫以下三個字段：
#
# BOT_TOKEN=8753829195:AAFozHe-1ivaFpjMwlttKQmsgiUUT7_zRLw
# DATABASE_URL=postgresql://metricgram:your_password@localhost:5432/metricgram
# JWT_SECRET=至少32字符的隨機字符串
```

### **Step 3：啟動數據庫**

```bash
# 使用 Docker Compose 啟動 PostgreSQL + Redis
docker-compose up -d

# 驗證容器運行
docker-compose ps
# 應看到：metricgram-db (healthy), metricgram-redis (running)
```

### **Step 4：初始化數據庫**

```bash
# 生成 Prisma Client
npx prisma generate

# 執行遷移（創建表）
npx prisma migrate dev --name init

# 導入種子數據（默認配置）
npx prisma db seed
```

### **Step 5：啟動服務**

```bash
# 開發模式（API + Bot 一起）
npm run dev

# 或分開啟動：
# Terminal 1: API Server
npm run start

# Terminal 2: Bot
npm run bot
```

### **Step 6：驗證安裝**

```bash
# 檢查 API 健康狀態
curl http://localhost:3001/health
# ✅ 應返回：{"status":"ok","timestamp":"2026-05-07T..."}

# 檢查 Bot 是否在線
# 打開 Telegram，向 @OneShotCasino_Bot 發送 /start
# ✅ 應該收到歡迎消息
```

---

## 🎯 **核心功能列表**

| 模塊 | 狀態 | 說明 |
|------|------|------|
| ✅ 認證 | 完成 | Telegram 登錄 + JWT |
| ✅ 群組綁定 | 完成 | 綁定管理員 + 模塊開關 |
| ✅ 輪播引擎 | 完成 | 多頻道定時發送 |
| ✅ 簽到系統 | 完成 | 連續簽到 + 積分 |
| ✅ 骰子遊戲 | 骨架 | 房間創建 + 賠率配置 |
| ✅ 錢包 | 骨架 | USDT 餘額管理 |
| ✅ 驗證 | 骨架 | 入群/關注驗證流程 |
| ✅ 搬運 | 骨架 | 關鍵詞過濾 |
| ✅ 廣播 | 骨架 | 定時廣播 |
| ✅ 儀表板 | 骨架 | 統計數據 |

---

## 🔧 **配置化操作（最重要）**

### **修改骰子賠率（無需重新部署）**

```sql
-- 連接到數據庫
psql -U metricgram -d metricgram

-- 查詢
SELECT * FROM game_settings WHERE settings_key = 'global_dice_settings';

-- 修改：牛牛改成 6 倍
UPDATE game_settings SET 
  settings_value = '{"niu_niu":6,"niu_9":4,...}'::jsonb 
WHERE settings_key = 'global_dice_settings';

-- 無需重啟，下一個遊戲自動生效
```

### **修改輪播文案（通過 API）**

```bash
# API 調用（使用 curl）
curl -X PUT http://localhost:3001/api/v1/carousel/content/骰子版-001 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentJson": {
      "text": "🎉 新規則：牛牛赔率提升到 6 倍！",
      "buttons": [{"text": "開始遊戲", "type": "callback", "value": "cmd_create_room"}]
    }
  }'

# 或使用管理後台（你的 React 界面）
```

---

## 📁 **文件結構速查**

```
metricgram-backend/
├── src/
│   ├── modules/          # 14 個功能模塊（ rifles）
│   │   ├── carousel/     # 🔄 輪播（最重要）
│   │   │   ├── services/
│   │   │   │   ├── contentService.ts  # 配置管理
│   │   │   │   └── carouselEngine.ts  # 調度器
│   │   │   └── routes.ts
│   │   ├── dice/         # 🎲 骰子
│   │   │   ├── services/gameService.ts
│   │   │   ├── bot/callbacks/diceHandlers.ts
│   │   │   └── routes.ts
│   │   ├── checkin/      # ✅ 簽到
│   │   ├── auth/         # 🔐 認證
│   │   └── ...           # 其他模塊
│   │
│   ├── bot/              # Telegram Bot 框架
│   │   ├── index.ts      # Bot 入口
│   │   ├── commands/     # /start /help
│   │   ├── callbacks/    # 按鈕回調
│   │   └── handlers/     # 消息處理
│   │
│   ├── jobs/             # 定時任務
│   │   └── carouselEngine.ts     # 輪播引擎 ⭐
│   │
│   └── shared/
│       └── constants.ts  # 賠率表/常量
│
├── prisma/
│   ├── schema.prisma     # 數據庫模型
│   └── seed.ts           # 初始化數據
│
└── Dockerfile            # 鏡像構建
```

---

## 🔑 **關鍵配置文件說明**

### **`.env` 必要字段**

```bash
# Telegram
BOT_TOKEN=8753829195:AAFozHe-xxxxx     # 從 @BotFather 獲取
BOT_USERNAME=OneShotCasino_Bot          # 機器人名稱（無 @）

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/metricgram

# JWT（強密碼）
JWT_SECRET=你的超長隨機字符串至少32位字符請務必修改

# 可選
STRIPE_SECRET_KEY=                # 支付（可稍後添加）
OPENAI_API_KEY=                   # AI 功能（可稍後添加）
```

---

## 🎮 **骰子遊戲流程圖**

```
[創建房間] → [莊家支付] → [等待加入] → [莊家擲骰] → [閒家擲骰] → [結算]
    ↓
修改database中的dice_games.status

每個狀態對應 Telegram Bot 按鈕：
- waiting:    [🏠 創建對戰]
- betting:    [🎯 開始遊戲]
- rolling:    [🎲 莊家擲骰] / [🎲 閒家擲骰]
- settling:   [🔔 結算中...]
- closed:     [🆗 我要繼續] / [🔙 返回主選單]
```

---

## 🐛 **常見問題**

### **Q1: npm install 報錯**
```bash
# 清理緩存重試
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Windows PowerShell 需要管理员权限
```

### **Q2: PostgreSQL 連接失敗**
```bash
# 檢查 Docker 容器狀態
docker-compose ps

# 查看日誌
docker-compose logs postgres

# 手動連線測試
psql -U metricgram -h localhost -p 5432 -d metricgram
```

### **Q3: Bot 不回复**
```bash
# 1. 刪除 Webhook（開發环境必做）
curl https://api.telegram.org/bot$BOT_TOKEN/deleteWebhook

# 2. 檢查 Bot Token
echo $BOT_TOKEN

# 3. 重啟 Bot
npm run dev
```

### **Q4: UTF-8 亂碼**
所有文件已確保 UTF-8 編碼。
如果出現亂碼：
1. 編輯器設置為 UTF-8 打开
2. 數據庫 `SHOW client_encoding;` → 應該是 `UTF8`
3. 前端 `<meta charset="UTF-8">` 已設置

---

## 📚 **詳細文檔**

- **`README.md`** - 項目介紹
- **`DEPLOY.md`** - 部署指南
- **`API_DOCS.md`** - API 完整文檔
- **`FRONTEND_INTEGRATION.md`** - 前端對接 cysteine
- **`prisma/schema.prisma`** - 數據庫 Schema（源文件）

---

## 🎯 **下一步**

1. ✅ 完成上述安裝步驟
2. ✅ 啟動開發服務器
3. ✅ 用 Postman 測試 API：`POST /auth/telegram`
4. ✅ 開啟 Telegram @OneShotCasino_Bot 發送 `/start`
5. ✅ 訪問前?端 (React 項目) 登錄測試

---

## 🆘 **需要幫助？**

- **查日誌**：`logs/application-*.log`
- **數據庫可視化**：`npx prisma studio` → http://localhost:5555
- **API 測試**：使用 Postman 或 curl

**祝你部署順利！🎉**

---

*Generated by Kilo - Metricgram Backend System v1.0.0*
