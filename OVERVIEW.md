# Metricgram - Telegram 群組管理系統

## 📦 **項目結構**

```
TelegramWEB/
├── app/                          # 前端 React 項目（你原有的）
│   └── src/
│       ├── pages/               # 所有頁面（已實現 15+ 頁面）
│       ├── components/           # UI 組件
│       ├── contexts/             # AuthContext（需輕微改動）
│       └── services/             # 【新建】API 客戶端
│
├── metricgram-shared-types/      # 🔶 共享 TypeScript 類型（新建）
│   └── src/
│       └── index.ts              # 枚舉、介面定義
│
├── metricgram-backend/           # 🔷 後端系統（新建）
│   ├── src/
│   │   ├── core/                 # 核心框架
│   │   │   ├── config/           # 環境配置
│   │   │   ├── database/         # Prisma 客戶端
│   │   │   ├── middleware/       # Express middleware
│   │   │   └── utils/            # 工具（UTF-8 安全）
│   │   │
│   │   ├── modules/              # 14個功能模塊（可擴展）
│   │   │   ├── auth/             # 🔐 認證
│   │   │   │   ├── routes.ts     # 路由
│   │   │   │   └── service.ts    # 業務邏輯
│   │   │   ├── carousel/         # 🔄 輪播（配置化核心）
│   │   │   │   ├── routes.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── contentService.ts  # 配置管理
│   │   │   │   │   └── carouselEngine.ts  # 調度引擎
│   │   │   │   └── jobs/
│   │   │   │       └── carouselScheduler.ts # 定時器
│   │   │   ├── dice/             # 🎲 骰子遊戲（最複雜）
│   │   │   │   ├── routes.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── gameService.ts
│   │   │   │   ├── bot/
│   │   │   │   │   ├── callbacks/
│   │   │   │   │   │   ├── diceHandlers.ts   # 按鈕映射
│   │   │   │   │   │   └── checkinHandlers.ts
│   │   │   │   │   └── commands/             # 指令處理
│   │   │   │   └── forms/                     # 遊戲狀態機
│   │   │   ├── checkin/           # ✅ 簽到
│   │   │   ├── wallet/            # 💰 錢包
│   │   │   ├── groups/            # 👥 群組
│   │   │   ├── verify/            # ✔️ 驗證
│   │   │   ├── forward/           # 📤 搬運
│   │   │   ├── broadcast/         # 📢 廣播
│   │   │   ├── activity/          # 🎪 活動
│   │   │   ├── night/             # 🌙 夜間
│   │   │   ├── clean/             # 🧹 清潔
│   │   │   └── dashboard/         # 📈 儀表板
│   │   │
│   │   ├── bot/                   # Telegram Bot 框架
│   │   │   ├── index.ts           # Bot 入口
│   │   │   ├── commands/          # 全局命令
│   │   │   ├── callbacks/         # 按鈕回調映射
│   │   │   ├── handlers/          # 消息處理
│   │   │   └── middlewares/       # Bot Middleware
│   │   │
│   │   ├── jobs/                  # 定時任務
│   │   │   ├── carouselEngine.ts  # 輪播引擎 ⭐
│   │   │   └── broadcastScheduler.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── events/            # 事件總線
│   │   │   └── constants.ts       # 常數（賠率表）
│   │   │
│   │   ├── app.ts                 # Express 應用
│   │   ├── server.ts              # HTTP 服務器
│   │   └── bot.ts                 # Bot 啟動器
│   │
│   ├── prisma/
│   │   ├── schema.prisma          # 數據模型（10+ 表）
│   │   └── seed.ts                # 初始化種子數據
│   │
│   ├── docker-compose.yml         # PostgreSQL + Redis
│   ├── Dockerfile                 # 鏡像構建
│   ├── .env.example               # 環境變數範本
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md                  # 後端文檔
│   └── DEPLOY.md                  # 部署指南
│
└── FRONTEND_INTEGRATION.md        # 🔗 前端對接完整指南
```

---

## 🎯 **核心設計原則**

### **1. 配置化驅動（一切可配置）**

| 配置類型 | 存儲位置 | 示例 | 修改方式 |
|---------|---------|------|---------|
| 輪播內容 | `carousel_content` 表 | 廣告版-001 的 JSON | 前端 UI |
| 骰子賠率 | `game_settings` 表 | `"niu_niu": 5` | 後台 API |
| 按鈕映射 | `button_handlers` 表 | `spin_wheel → handleSpinWheel` | 數據庫 |
| 模塊開關 | `groups.modulesEnabled` | `{ dice: true }` | 開關 UI |
| 定時任務 | `scheduled_tasks` 表 | `0 11 * * *` | Cron 表達式 |

**腳本不動原則**：所有業務邏輯編寫後不再修改，僅通過數據驅動。

---

### **2. 前後端依賴對齊**

```json
// 前?端 package.json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-router-dom": "^7.15.0",
    "zod": "^4.3.5",
    "@metricgram/shared-types": "workspace:*"  ← 共享類型
  }
}

// 後端 package.json
{
  "dependencies": {
    "express": "^4.21.0",
    "zod": "^4.3.5",                        ← 版本保持一致
    "@metricgram/shared-types": "workspace:*",
    "prisma": "^6.5.0",
    "node-telegram-bot-api": "^0.64.0"
  }
}
```

---

### **3. UTF-8 編碼保證**

所有文件均為 `UTF-8 無 BOM`：
- ✅ TypeScript 源碼
- ✅ JSON 配置文件
- ✅ 數據庫（PostgreSQL 默認 UTF8）
- ✅ API 響應 `charset=utf-8`
- ✅ 前?端 `<meta charset="UTF-8">`

---

## 🚀 **快速啟動流程**

```bash
# 1. Step 1: 安裝共享類型包
cd metricgram-shared-types
npm install && npm run build

# 2. Step 2: 後端初始化
cd ../metricgram-backend
npm install

# 3. Step 3: 複製環境變數
cp .env.example .env
# 編輯 .env，填入：
# - BOT_TOKEN=8753829195:AAFozHe-...
# - DATABASE_URL=postgresql://...
# - JWT_SECRET=隨機字符串

# 4. Step 4: 啟動數據庫
docker-compose up -d postgres redis

# 5. Step 5: 數據庫遷移
npx prisma migrate dev --name init
npx prisma db seed   # 導入默認配置

# 6. Step 6: 啟動開發服務器
npm run dev
```

### **驗證**
```
✅ API: http://localhost:3001/health       → {"status":"ok"}
✅ Bot: 在 Telegram 發送 /start → 應該收到歡迎消息
```

---

## 🔧 **配置化操作示例**

### **場景 1：修改骰子賠率（無需重新部署）**

```sql
-- 連接數據庫
psql -U metricgram -d metricgram

-- 查詢當前賠率
SELECT * FROM game_settings WHERE settings_key = 'multipliers';

-- 修改賠率（例如：牛牛改成 6 倍）
UPDATE game_settings
SET settings_value = '{"niu_niu": 6, "niu_9": 4, ...}'
WHERE settings_key = 'multipliers';

-- 無需重啟，Bot 下次結算時自動使用新賠率
```

---

### **場景 2：修改輪播文案（後台界面操作）**

```typescript
// 前?端發送 API 請求
PUT /api/v1/carousel/content/骰子版-001
{
  "contentJson": {
    "text": "🎉 新的Rules！牛牛 6倍！",
    "buttons": [ ... ]
  }
}

// 後端：更新數據庫
UPDATE carousel_content 
SET content_json = '{"text":"..."}'
WHERE content_key = '骰子版-001';

// 輪播引擎下次讀取時自動使用新文案，無需重啟
```

---

## 📊 **數據庫 Schema 對應图**

```
┌─────────────┐     ┌────────────────┐
│   users     │◄────┤  checkins      │
│-------------│     │----------------│
│ id          │     │ id            │
│ telegram_id │     │ user_id       │
│ points      │     │ pointsEarned  │
│ balance     │     └────────────────┘
└─────────────┘
       │
       ├─────► groups
       │       │ modulesEnabled (JSON)
       │       │ diceSettings (JSON)
       │       │ carouselSettings (JSON)
       │
       ├─────► dice_games ────► dice_participants
       │       │ status        │ betUsdt
       │       │ hostDiceJson  │ playerDiceJson
       │       └───────────────┘ result
       │
       ├─────► wallet_transactions
       │
       └─────► wheel_spins
```

---

## 🎮 **骰子遊戲數據流**

```
用戶點擊"創建房間"
    ↓
POST /dice/rooms
    ↓
1. 生成 roomId (ROOM_20260507_001)
2. 插入 dice_games 表 (status=waiting)
3. 返回房間信息
    ↓
Bot 發送创建成功消息 + 按鈕
    ↓
閒家點擊"加入"
    ↓
POST /dice/rooms/:id/join
    ↓
1. 檢查遊戲狀態
2. 插入 dice_participants
3. 觸發支付流程（OKPay）
    ↓
莊家點擊"開始遊戲"
    ↓
POST /dice/rooms/:id/host-roll
    ↓
Bot 發送骰子動畫 🎲 → 接收 telegram.message.dice
    ↓
計算點數 → 更新 hostResult
    ↓
閒家擲骰（同上）
    ↓
所有人擲完 → POST /settlement
    ↓
1. 比較牌型
2. 計算賠率（從 game_settings 讀取）
3. 扣除公積金 5%
4. 發放獎金到錢包
5. 更新狀態 = closed
    ↓
Bot 發送結算消息
```

---

## 🛠️ **故障診斷目录**

### **問題：Bot 不回复消息**

```bash
# 1. 檢查 Webhook（如有）
curl https://api.telegram.org/bot<token>/getWebhookInfo

# 2. 刪除 Webhook（開發用）
curl https://api.telegram.org/bot<token>/deleteWebhook

# 3. 日誌排查
tail -f logs/bot.log
```

### **問題：API 返回 500 錯誤**

```bash
# 1. 檢查環境變數
cat .env | grep -E 'BOT_TOKEN|DATABASE_URL|JWT_SECRET'

# 2. 檢查數據庫連線
npx prisma studio  # 打開 Prisma Studio (http://localhost:5555)

# 3. 查看詳細日誌
pm2 logs metricgram-api
```

### **問題：骰子消息不顯示動畫**

```typescript
// ❌ 錯誤：使用 sendMessage 發送 🎲 emoji
await ctx.reply('🎲');

// ✅ 正確：使用 sendDice
await ctx.bot.sendDice(chatId, { emoji: '🎯' });  // ⚠️ 必須用 dice emoji
```

---

## 📞 **聯繫方式**

- **項目文檔**：`metricgram-backend/README.md`
- **API 文檔**：`metricgram-backend/API_DOCS.md`
- **前端對接**：`FRONTEND_INTEGRATION.md`
- **部署指南**：`metricgram-backend/DEPLOY.md`

---

## ✅ **完成清單**

- [x] 後端項目骨架
- [x] 共享類型包
- [x] Prisma Schema（10 表）
- [x] Docker Compose（PostgreSQL + Redis）
- [x] Express 核心框架
- [x] Telegram Bot 框架
- [x] 14 個模塊架構
- [x] 配置化輪播引擎
- [x] 按鈕映射機制
- [x] ContentService（配置管理）
- [x] 骰子游戲邏輯骨架
- [x] API 路由集
- [x] 前端對接指南
- [x] 部署文檔

---

**🚀 開始部署：請參閱 `DEPLOY.md`**
