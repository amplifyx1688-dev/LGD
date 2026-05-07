# API 完整文档

## 📖 **Base URL**
```
Development: http://localhost:3001/api/v1
Production:  https://your-domain.com/api/v1
```

---

## 🔐 **認證 API**

### **POST /auth/telegram**
Telegram 登錄（Widget 回調用）

**Request:**
```json
{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://...",
  "auth_date": 1700000000,
  "hash": "..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "telegramId": 123456789,
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "points": 10,
      "balanceUsdt": 0
    }
  }
}
```

---

## 🎲 **骰子 API**

### **POST /dice/rooms**
創建房間

**Request:**
```json
{
  "groupId": 1,
  "minBet": 1,
  "maxBet": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "roomId": "ROOM_20260507_001",
    "status": "waiting",
    "hostUserId": 123,
    "minBetUsdt": "1.0000",
    "maxBetUsdt": "1000.0000"
  }
}
```

### **POST /dice/rooms/:roomId/join**
加入房間

**Request:**
```json
{
  "betUsdt": 50,
  "betMode": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "betUsdt": "50.0000",
    "betMultiplier": 1,
    "status": "waiting"
  }
}
```

---

## 📊 **儀表板 API**

### **GET /dashboard/overview**
獲取統計總覽

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 101,
    "activeUsers": 77,
    "totalMessages": 1014,
    "todayCheckins": 42,
    "chartData": {
      "daily": [40, 65, 30, ...]
    }
  }
}
```

---

## 🔧 **輪播配置 API**

### **PUT /carousel/content/:key**
更新輪播內容（完全配置化）

**Request:**
```json
{
  "groupId": 1,
  "module": "carousel",
  "contentType": "dice",
  "contentJson": {
    "image": "account/212-2-1.png",
    "text": "<b>🎲 骰子遊戲規則</b>\n\n點擊下方按鈕開始遊戲：",
    "buttons": [
      {
        "text": "🎲 開始遊戲",
        "type": "callback",
        "value": "cmd_create_room",
        "row": 0
      },
      {
        "text": "🔙 返回主選單",
        "type": "callback",
        "value": "back_to_main",
        "row": 0
      }
    ]
  },
  "isActive": true,
  "sortOrder": 10
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "contentKey": "骰子版-001",
    "module": "carousel",
    "contentJson": { ... }  // 存儲的完整內容
  }
}
```

---

## 🔄 **Webhook 接口**

### **POST /api/telegram/webhook**
Telegram Bot Webhook 接收端（由 Telegram 调用）

**无需认证，仅用于 Bot 接收消息**

---

## 📋 **完整端點清單**

| 方法 | 路徑 | 說明 | 認證 |
|------|------|------|------|
| **Auth** | | | |
| POST | `/auth/telegram` | Telegram 登錄 | ❌ 公開 |
| GET | `/auth/me` | 獲取當前用戶 | ✅ |
| POST | `/auth/logout` | 登出 | ✅ |
| **Groups** | | | |
| GET | `/groups` | 獲取群組列表 | ✅ |
| POST | `/groups/bind` | 綁定群組 | ✅ |
| PATCH | `/groups/:id/modules` | 更新模塊開關 | ✅ |
| **Carousel** | | | |
| GET | `/carousel/content` | 獲取輪播列表 | ✅ |
| GET | `/carousel/content/:key` | 獲取單個內容 | ✅ |
| PUT | `/carousel/content/:key` | 保存內容 | ✅ |
| DELETE | `/carousel/content/:key` | 刪除內容 | ✅ |
| **Checkin** | | | |
| POST | `/checkin` | 簽到 | ✅ |
| GET | `/checkin/profile` | 個人詳情 | ✅ |
| POST | `/checkin/spin-wheel` | 轉輪盤 | ✅ |
| **Dice** | | | |
| POST | `/dice/rooms` | 創建房間 | ✅ |
| GET | `/dice/rooms/:roomId` | 房間詳情 | ✅ |
| POST | `/dice/rooms/:id/join` | 加入房间 | ✅ |
| POST | `/dice/rooms/:id/host-roll` | 莊家擲骰 | ✅ |
| POST | `/dice/rooms/:id/player-roll` | 閒家擲骰 | ✅ |
| POST | `/dice/rooms/:id/settlement` | 結算 | ✅ |
| GET | `/dice/history` | 歷史戰績 | ✅ |
| **Dashboard** | | | |
| GET | `/dashboard/overview` | 統計總覽 | ✅ |
| GET | `/dashboard/messages` | 消息統計 | ✅ |
| GET | `/dashboard/users` | 用戶統計 | ✅ |
| GET | `/dashboard/export` | 導出報表 | ✅ |

---
