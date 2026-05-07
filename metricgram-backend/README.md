# Metricgram 後端系統

> 完全配置化的 Telegram 群組管理機器人後端

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd metricgram-backend
npm install

# 安裝共享類型包（在父目錄）
cd ../metricgram-shared-types
npm install
npm run build
cd ../metricgram-backend
```

### 2. 環境配置

```bash
# 複製環境變數模板
cp .env.example .env

# 編輯 .env，填入以下必需項：
# - BOT_TOKEN (你的 Telegram Bot Token)
# - DATABASE_URL (PostgreSQL 連接字符串)
# - JWT_SECRET (任意安全字符串)
```

### 3. 啟動資料庫（Docker）

```bash
# 啟動 PostgreSQL + Redis
docker-compose up -d postgres redis

# 等待數據庫就緒（約 5 秒）
docker-compose ps
```

### 4. 初始化數據庫

```bash
# 生成 Prisma Client
npx prisma generate

# 執行遷移（創建表結構）
npx prisma migrate dev --name init

# 導入種子數據（默認配置）
npx prisma db seed
```

### 5. 啟動服務

```bash
# 開發模式（API + Bot 一起啟動）
npm run dev

# 或分開啟動：
# Terminal 1: API Server
npm start

# Terminal 2: Bot
npm run bot
```

### 6. 驗證安裝

```bash
# 檢查 API 健康狀態
curl http://localhost:3001/health

# 應該返回：{"status":"ok","timestamp":"..."}
```

---

## 📁 項目結構

```
metricgram-backend/
├── src/
│   ├── core/               # 核心框架（不可動）
│   │   ├── config/         # 環境變數 + 配置
│   │   ├── database/       # Prisma客戶端
│   │   ├── middleware/     # Express 中間件
│   │   ├── utils/          # 工具函數
│   │   └── types/          # 全域類型
│   │
│   ├── modules/            # 功能模塊（可擴展）
│   │   ├── auth/           # 認證模塊
│   │   ├── groups/         # 群組管理
│   │   ├── carousel/       # 輪播模塊 ⭐
│   │   ├── checkin/        # 簽到模塊
│   │   ├── dice/           # 骰子遊戲 ⭐
│   │   ├── wallet/         # 錢包管理
│   │   ├── verify/         # 驗證流程
│   │   ├── forward/        # 搬運模塊
│   │   ├── broadcast/      # 廣播模塊
│   │   ├── activity/       # 活動模塊
│   │   ├── night/          # 夜間模塊
│   │   ├── clean/          # 清潔模塊
│   │   └── dashboard/      # 數據儀表板
│   │
│   ├── bot/                # Telegram Bot
│   │   ├── index.ts        # Bot 入口
│   │   ├── commands/       # 指令處理
│   │   ├── callbacks/      # 按鈕回調處理
│   │   ├── handlers/       # 消息處理
│   │   ├── middlewares/    # Bot 專用 middleware
│   │   └── utils/          # 工具函數
│   │
│   ├── jobs/               # 定時任務
│   │   ├── carouselScheduler.ts  # 輪播調度器 ⭐
│   │   ├── broadcastScheduler.ts
│   │   └── nightModeScheduler.ts
│   │
│   ├── shared/             # 共享資源
│   │   ├── constants.ts    # 常數（賠率、概率等）
│   │   └── events/         # 事件總線
│   │
│   ├── app.ts              # Express 應用配置
│   ├── server.ts           # HTTP 服務器入口
│   └── bot.ts              # Bot 啟動器
│
├── prisma/
│   ├── schema.prisma       # 數據庫模型（10+ 張表）
│   └── seed.ts             # 初始化數據
│
├── .env.example            # 環境變數範本
├── docker-compose.yml      # 容器编排
├── Dockerfile              # 鏡像構建
├── package.json
└── README.md
```

---

## 🔧 配置文件说明

### **配置文件 vs 數據庫配置（核心原則）**

| 配置類型 | 存储位置 | 示例 | 是否可運行時修改 |
|---------|---------|------|---------------|
| 系統參數 | `.env` | `PORT`, `JWT_SECRET` | ❌ 需重啟 |
| 模塊開關 | `groups` 表 | `modulesEnabled` JSON | ✅ 動態 |
| 輪播內容 | `carousel_content` 表 | 廣告版-001 的 JSON | ✅ 動態 |
| 骰子賠率 | `game_settings` 表 | `multipliers` | ✅ 動態 |
| 定時任務 | `scheduled_tasks` 表 | Cron 表達式 | ✅ 動態 |
| 按鈕映射 | `button_handlers` 表 | handler_key → 函數名 | ✅ 動態 |

**設計理念**：腳本不動原則
- 所有邏輯代碼寫好後 **不再修改**
- 任何功能調整只需 **修改數據庫**
- 新增功能只需 **添加配置 + 註冊處理器**

---

## 📊 數據庫設計（配置化核心）

### **關鍵表格說明**

#### **`carousel_content`** - 輪播內容（完全配置化）
此表存儲所有可配置的 message 文本，不 hardcode。

```sql
-- 示例數據（前?端編輯後保存到這裡）
INSERT INTO carousel_content (content_key, content_json, module, is_active, sort_order)
VALUES (
  '骰子版-001',
  '{
    "image": "account/212-2-1.png",
    "text": "<b>🎲 骰子遊戲規則</b>...",
    "buttons": [
      {"text": "創建對戰", "type": "callback", "value": "cmd_create_room"},
      {"text": "返回主選單", "type": "callback", "value": "back_to_main"}
    ]
  }',
  'carousel',
  true,
  10
);
```

#### **`button_handlers`** - 按鈕處理器映射
```sql
INSERT INTO button_handlers (handler_key, handler_name, module) VALUES
('cmd_create_room', 'handleCreateRoom', 'dice'),
('do_signin', 'handleCheckin', 'checkin'),
('spin_wheel', 'handleSpinWheel', 'checkin');
```

#### **`module_configs`** - 模塊配置
```json
{
  "module_id": 1,
  "group_id": null,  // NULL = 全局配置
  "config_json": {
    "intervalSeconds": 5,
    "startIndex": 0,
    "timeWindows": {
      "voice": { "start": "08:00", "end": "22:00" }
    }
  }
}
```

---

## 🎯 API 端點列表

### **認證 (`/api/v1/auth`)**
- `POST /telegram` - Telegram 登錄（hash 驗證）
- `GET /me` - 獲取當前用戶信息
- `POST /logout` - 登出

### **群組 (`/api/v1/groups`)**
- `GET /` - 獲取用戶綁定群組列表
- `POST /bind` - 綁定新群組
- `PATCH /:id/modules` - 更新模塊開關
- `GET /:id` - 獲取群組詳細配置

### **輪播 (`/api/v1/carousel`)**
- `GET /content` - 獲取輪播內容列表
- `GET /content/:key` - 獲取單個配置
- `PUT /content/:key` - 保存配置（upsert）
- `DELETE /content/:key` - 刪除配置
- `PATCH /content/sort-order` - 更新排序

### **骰子 (`/api/v1/dice`)**
- `POST /rooms` - 創建房間
- `GET /rooms/:roomId` - 獲取房間詳情
- `POST /rooms/:roomId/join` - 加入房間
- `POST /rooms/:roomId/host-roll` - 莊家擲骰
- `POST /rooms/:roomId/player-roll` - 閒家擲骰
- `POST /rooms/:roomId/settlement` - 結算
- `GET /history` - 歷史戰績

### **簽到 (`/api/v1/checkin`)**
- `POST /` - 簽到
- `GET /profile` - 個人詳情
- `POST /spin-wheel` - 轉輪盤

### **儀表板 (`/api/v1/dashboard`)**
- `GET /overview` - 總覽數據
- `GET /messages` - 消息統計
- `GET /users` - 用戶統計
- `GET /export` - 導出報表

---

## 🔄 前端對接指南

### **1. 替換 API 地址**

你的前端 React 項目在 `app/` 目錄，需要修改 API 地址：

```typescript
// app/src/services/api.ts (新建)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const api = {
  auth: {
    telegram: (data) => fetch(`${API_BASE}/auth/telegram`, { ... }),
    me: () => fetch(`${API_BASE}/auth/me`, { ... })
  },
  carousel: {
    list: (groupId) => fetch(`${API_BASE}/carousel/content?groupId=${groupId}`),
    get: (key, groupId) => fetch(`${API_BASE}/carousel/content/${key}?groupId=${groupId}`),
    update: (key, data) => fetch(`${API_BASE}/carousel/content/${key}`, { ... })
  },
  // ... 其他模塊
};
```

### **2. 修改.env文件**

```bash
# app/.env
VITE_API_URL=http://localhost:3001
VITE_TELEGRAM_BOT_NAME=OneShotCasino_Bot
```

### **3. 保持組件不變（配置化後端）**

你的所有前端組件（`TelegramLogin.tsx`, `Dashboard.tsx` 等）**不需要大改**，只需要：
- 將 localStorage 登錄狀態替換為 API token
- 將硬編碼數據替換為 API 請求

---

## 🎮 骰子遊戲配置示例

### **前?端管理界面編輯流程**

```
1. 管理員登錄後端
   ↓
2. 打開「骰子版-001」編輯頁面
   GET /api/v1/carousel/content/骰子版-001?groupId=1
   ↓
   後端返回：{
     "contentJson": {
       "image": "account/212-2-1.png",
       "text": "...規則說明...",
       "buttons": [
         {"text": "創建對戰", "type": "callback", "value": "cmd_create_room"}
       ]
     }
   }
   ↓
3. 前端渲染表單（圖片上傳、文本編輯、按鈕列表）
   ↓
4. 管理員修改保存
   PUT /api/v1/carousel/content/骰子版-001
   Body: { contentJson: { ... } }
   ↓
5. 輪播引擎下次讀取自動使用新配置
```

---

## 🐛 調試說明

### **查看日誌**

```bash
# 後端日誌（在 metrics-backend/logs/ 目錄）
tail -f logs/application-*.log

# Bot 日誌（分開記錄）
tail -f logs/bot-*.log
```

### **常見問題**

#### **Q1：Bot 收不到消息**
```bash
# 檢查 Webhook
curl https://api.telegram.org/bot<token>/getWebhookInfo

# 如果設置了 Webhook 但本地開發，需要刪除：
curl https://api.telegram.org/bot<token>/deleteWebhook
```

#### **Q2：骰子不發送官方動畫**
```javascript
// 需要使用 sendDice API（非 sendMessage + emoji）
await ctx.bot.sendDice(chatId, { emoji: '🎲' });
```

#### **Q3：UTF-8 亂碼**
- 所有Node.js進程默認UTF-8
- 數據庫創建時指定 `ENCODING = 'UTF8'`
- 前端 `<meta charset="UTF-8">` 已設置

---

## 📈 性能優化建議

### **1. 數據庫索引（必要）**
```sql
-- Prisma 已自動創建，但可手動補充
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_users_checkin ON checkins(user_id, checked_at DESC);
```

### **2. Redis 快取（可選）**
```typescript
// 頻繁查詢的數據加入快取
const cached = await redis.get(`user:${userId}:stats`);
if (cached) return JSON.parse(cached);
```

### **3. 圖片 CDN**
輪播圖片建議上傳到 Telegram 文件/OSS，直接使用 URL。

---

## 🚀 部署到 Production

### **環境變數差異**

```bash
# .env (Production)
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=very-long-random-string-here

# 關閉輪詢模式
TELEGRAM_POLLING=false
WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook

# 啟用 HTTPS（強制）
FORCE_HTTPS=true
```

### **Docker 部署**

```bash
# 構建鏡像
docker build -t metricgram-backend .

# 運行
docker run -d \
  --name metricgram-api \
  -p 3001:3001 \
  --env-file .env \
  metricgram-backend
```

### **Vercel / Railway 部署**

1. 推送代碼到 GitHub
2. 在 Vercel 導入項目
3. 環境變數填入 `.env` 內容
4. 部署完成

---

## 📝 注意事項

⚠️ **重要提醒**

1. **Telegram Token 保密**：`.env` 文件不要提交到 Git
2. **JWT_SECRET 強度**：至少 32 字符，隨機生成
3. **數據庫備份**：每日自動備份
4. **錯誤監控**：建議集成 Sentry
5. **速率限制**：API 已配置，可按需調整
6. **HTTPS 必需**：Webhook 必須 HTTPS

---

## 🤝 貢獻與支持

如有問題，請查閱：
- `metricgram-shared-types/` - 類型定義
- `prisma/schema.prisma` - 數據庫結構
- `src/modules/` - 各模塊實現

---

**🆓 License：MIT**
**⚡ Version：1.0.0**
**👨‍💻 Author：Metricgram Team**
