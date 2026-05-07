# 前端 API 對接指南

## 📦 1. 安裝共享類型包

```bash
# 在 app/ 目錄（你的前端項目）
cd ../app

# 將共享類型包链接到前端（symlink）
npm install ../metricgram-shared-types
```

### **驗證安裝**

```typescript
// app/src/testTypes.ts
import { User, ButtonConfig, DiceGameStatus } from '@metricgram/shared-types';

const user: User = {
  id: 1,
  telegramId: 123456789n,
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  photoUrl: null,
  points: 10,
  totalPointsEarned: 10,
  totalPointsSpent: 0,
  lastCheckinAt: new Date(),
  checkinStreak: 1,
  checkinCount: 1,
  balanceUsdt: 0,
  isVerified: true,
  isBlacklisted: false,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

---

## 🔧 2. 創建 API 客戶端

### **文件結構**

```
app/
├── src/
│   ├── services/
│   │   ├── api.ts          # Axios 實例 + 拦截器
│   │   ├── auth.ts         # 認證 API
│   │   ├── carousel.ts     # 輪播 API
│   │   ├── checkin.ts      # 簽到 API
│   │   ├── dice.ts         # 骰子 API
│   │   └── groups.ts       # 群組 API
```

---

### **`services/api.ts` - HTTP 客戶端**

```typescript
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { ApiResponse, User } from '@metricgram/shared-types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * 創建 Axios 實例
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
});

/**
 * 請求攔截器：自動附加 Token
 */
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 響應攔截器：處理錯誤
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response;
  },
  (error: any) => {
    console.error('API Error:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Token 過期，跳轉登入
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

/**
 * 泛型封裝：確保返回類型安全
 */
export async function apiGet<T>(url: string): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url);
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data!;
}

export async function apiPost<T>(url: string, data?: any): Promise<T> {
  const res = await apiClient.post<ApiResponse<T>>(url, data);
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data!;
}

export async function apiPut<T>(url: string, data?: any): Promise<T> {
  const res = await apiClient.put<ApiResponse<T>>(url, data);
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data!;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await apiClient.delete<ApiResponse<T>>(url);
  if (!res.data.success) throw new Error(res.data.error);
  return res.data.data!;
}
```

---

### **`services/auth.ts` - 認證模塊**

```typescript
import { apiPost, apiGet } from './api';
import type { User } from '@metricgram/shared-types';

/**
 * Telegram 登錄
 */
export async function telegramLogin(data: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}): Promise<{ token: string; user: User }> {
  return apiPost('/auth/telegram', data);
}

/**
 * 獲取當前用戶
 */
export async function getCurrentUser(): Promise<User> {
  return apiGet('/auth/me');
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  await apiPost('/auth/logout');
}

/**
 * 存儲 Token
 */
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

/**
 * 清除 Token
 */
export function clearToken(): void {
  localStorage.removeItem('token');
}

/**
 * 獲取 Token
 */
export function getToken(): string | null {
  return localStorage.getItem('token');
}
```

---

### **`services/carousel.ts` - 輪播模塊**

```typescript
import { apiGet, apiPut, apiDelete } from './api';
import type { ContentItem } from '@metricgram/shared-types';

/**
 * 獲取群組所有輪播內容
 */
export async function getCarouselContents(
  groupId: number,
  module: string = 'carousel'
): Promise<ContentItem[]> {
  return apiGet(`/carousel/content?groupId=${groupId}&module=${module}`);
}

/**
 * 獲取單個內容配置
 */
export async function getCarouselContent(
  groupId: number,
  contentKey: string
): Promise<ContentItem> {
  return apiGet(`/carousel/content/${contentKey}?groupId=${groupId}`);
}

/**
 * 創建/更新輪播內容
 */
export async function upsertCarouselContent(data: {
  groupId?: number;      // null = 全局配置
  contentKey: string;
  module: string;
  contentType: string;
  contentJson: {
    image?: string;
    text: string;
    buttons: Array<{
      text: string;
      type: 'link' | 'callback' | 'webapp';
      value: string;
      row?: number;
    }>;
  };
  isActive?: boolean;
  sortOrder?: number;
}): Promise<ContentItem> {
  return apiPut(`/carousel/content/${data.contentKey}`, data);
}

/**
 * 刪除輪播內容
 */
export async function deleteCarouselContent(
  groupId: number,
  contentKey: string
): Promise<void> {
  await apiDelete(`/carousel/content/${contentKey}?groupId=${groupId}`);
}

/**
 * 批量更新排序
 */
export async function updateSortOrder(
  groupId: number,
  items: Array<{ contentKey: string; sortOrder: number }>
): Promise<void> {
  await apiPut('/carousel/content/sort-order', { items });
}
```

---

### **`services/dice.ts` - 骰子模塊**

```typescript
import { apiGet, apiPost } from './api';
import type { DiceGame, DiceParticipant } from '@metricgram/shared-types';

/**
 * 創建骰子房間
 */
export async function createDiceRoom(params: {
  groupId: number;
  minBet?: number;
  maxBet?: number;
}): Promise<DiceGame> {
  return apiPost('/dice/rooms', params);
}

/**
 * 加入房間
 */
export async function joinDiceRoom(
  roomId: string,
  betUsdt: number,
  betMode: 'normal' | 'double' = 'normal'
): Promise<DiceParticipant> {
  return apiPost(`/dice/rooms/${roomId}/join`, { betUsdt, betMode });
}

/**
 * 莊家擲骰
 */
export async function hostRollDice(roomId: string) {
  return apiPost(`/dice/rooms/${roomId}/host-roll`);
}

/**
 * 閒家擲骰
 */
export async function playerRollDice(roomId: string) {
  return apiPost(`/dice/rooms/${roomId}/player-roll`);
}

/**
 * 結算遊戲
 */
export async function settleGame(roomId: string) {
  return apiPost(`/dice/rooms/${roomId}/settlement`);
}

/**
 * 獲取房間詳情
 */
export async function getDiceRoom(roomId: string): Promise<DiceGame> {
  return apiGet(`/dice/rooms/${roomId}`);
}

/**
 * 獲取歷史戰績
 */
export async function getGameHistory(limit?: number) {
  return apiGet(`/dice/history?limit=${limit || 10}`);
}
```

---

## 🎯 3. React Hook 封裝

### **`hooks/useAuth.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, setToken, getToken, clearToken, logout as apiLogout } from '@/services/auth';
import type { User } from '@metricgram/shared-types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：加載用戶信息
  useEffect(() => {
    const token = getToken();
    if (token) {
      getCurrentUser()
        .then(setUser)
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // 登錄
  const login = useCallback(async (telegramData: any) => {
    const { token, user } = await telegramLogin(telegramData);
    setToken(token);
    setUser(user);
    return user;
  }, []);

  // 登出
  const logout = useCallback(async () => {
    await apiLogout();
    clearToken();
    setUser(null);
  }, []);

  return { user, loading, login, logout, isLoggedIn: !!user };
}
```

---

### **`hooks/useCarousel.ts`**

```typescript
import { useState, useEffect } from 'react';
import { getCarouselContents, upsertCarouselContent } from '@/services/carousel';
import type { ContentItem } from '@metricgram/shared-types';

export function useCarouselContents(groupId: number, module: string = 'carousel') {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 加載輪播內容列表
  const loadContents = async () => {
    try {
      const data = await getCarouselContents(groupId, module);
      setContents(data);
    } catch (error) {
      console.error('Failed to load carousel:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存單個內容（用於編輯表單）
  const saveContent = async (data: Partial<ContentItem>) => {
    const updated = await upsertCarouselContent({
      groupId,
      contentKey: data.id,
      module: data.module,
      contentType: data.category,
      contentJson: data.content,
      isActive: data.display?.isActive,
      sortOrder: data.display?.sortOrder
    });

    setContents(prev => 
      prev.map(c => c.id === data.id ? updated : c)
    );
  };

  return { contents, loading, loadContents, saveContent };
}
```

---

## 🎨 4. 前端組件示例

### **輪播編輯器組件**

```typescript
// components/CarouselEditor.tsx
import { useState, useEffect } from 'react';
import { useCarouselContents } from '@/hooks/useCarousel';
import type { ContentItem } from '@metricgram/shared-types';

interface Props {
  groupId: number;
  contentKey: string;
}

export function CarouselEditor({ groupId, contentKey }: Props) {
  const { contents, loading, saveContent } = useCarouselContents(groupId);
  const [current, setCurrent] = useState<ContentItem | null>(null);

  useEffect(() => {
    const found = contents.find(c => c.id === contentKey);
    if (found) setCurrent(found);
  }, [contents, contentKey]);

  const handleSave = async (updatedData: any) => {
    await saveContent({ ...current, ...updatedData });
    alert('保存成功！');
  };

  if (loading) return <div>載入中...</div>;
  if (!current) return <div>未找到內容</div>;

  return (
    <div className="space-y-4">
      <h2>編輯輪播：{current.id}</h2>
      
      {/* 圖片上傳 */}
      <Input
        label="圖片 URL"
        value={current.content.image || ''}
        onChange={(e) => setCurrent({
          ...current,
          content: { ...current.content, image: e.target.value }
        })}
      />

      {/* 文字編輯 (HTML) */}
      <Textarea
        label="文字內容"
        value={current.content.text}
        onChange={(e) => setCurrent({
          ...current,
          content: { ...current.content, text: e.target.value }
        })}
        rows={6}
      />

      {/* 按鈕列表 */}
      <div>
        <h3>按鈕列表</h3>
        {current.content.buttons.map((btn, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <Input
              value={btn.text}
              placeholder="按鈕文字"
              onChange={(e) => {
                const newButtons = [...current.content.buttons];
                newButtons[idx].text = e.target.value;
                setCurrent({ ...current, content: { ...current.content, buttons: newButtons } });
              }}
            />
            <Select
              value={btn.type}
              onChange={(e) => {
                const newButtons = [...current.content.buttons];
                newButtons[idx].type = e.target.value as any;
                setCurrent({ ...current, content: { ...current.content, buttons: newButtons } });
              }}
              options={['link', 'callback', 'webapp']}
            />
            <Input
              value={btn.value}
              placeholder="URL 或 Callback Data"
              onChange={(e) => {
                const newButtons = [...current.content.buttons];
                newButtons[idx].value = e.target.value;
                setCurrent({ ...current, content: { ...current.content, buttons: newButtons } });
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => handleSave(current)}
        className="btn-primary"
      >
        保存
      </button>
    </div>
  );
}
```

---

## 📋 5. 完整 API 對應表

| 功能 | 後端 API | 前端文件名 | Hook 名稱 |
|------|---------|-----------|----------|
| **認證** | | | |
| Telegram 登錄 | `POST /auth/telegram` | `services/auth.ts` | `useAuth()` |
| 獲取用戶信息 | `GET /auth/me` | `services/auth.ts` | - |
| 登出 | `POST /auth/logout` | `services/auth.ts` | - |
| | | | |
| **群組** | | | |
| 獲取群組列表 | `GET /groups` | `services/groups.ts` | `useGroups()` |
| 綁定群組 | `POST /groups/bind` | `services/groups.ts` | - |
| 更新模塊開關 | `PATCH /groups/:id/modules` | `services/groups.ts` | - |
| | | | |
| **輪播** | | | |
| 獲取內容列表 | `GET /carousel/content` | `services/carousel.ts` | `useCarouselContents()` |
| 獲取單個內容 | `GET /carousel/content/:key` | `services/carousel.ts` | - |
| 保存內容 | `PUT /carousel/content/:key` | `services/carousel.ts` | - |
| 刪除內容 | `DELETE /carousel/content/:key` | `services/carousel.ts` | - |
| 更新排序 | `PATCH /carousel/content/sort-order` | `services/carousel.ts` | - |
| | | | |
| **骰子** | | | |
| 創建房間 | `POST /dice/rooms` | `services/dice.ts` | `useDiceRoom()` |
| 加入房間 | `POST /dice/rooms/:id/join` | `services/dice.ts` | - |
| 莊家擲骰 | `POST /dice/rooms/:id/host-roll` | `services/dice.ts` | - |
| 閒家擲骰 | `POST /dice/rooms/:id/player-roll` | `services/dice.ts` | - |
| 結算遊戲 | `POST /dice/rooms/:id/settlement` | `services/dice.ts` | - |
| 歷史戰績 | `GET /dice/history` | `services/dice.ts` | - |
| | | | |
| **簽到** | | | |
| 執行簽到 | `POST /checkin` | `services/checkin.ts` | `useCheckin()` |
| 獲取個人詳情 | `GET /checkin/profile` | `services/checkin.ts` | - |
| 轉動輪盤 | `POST /checkin/spin-wheel` | `services/checkin.ts` | - |
| | | | |
| **儀表板** | | | |
| 獲取概覽 | `GET /dashboard/overview` | `services/dashboard.ts` | `useDashboard()` |
| 消息統計 | `GET /dashboard/messages` | `services/dashboard.ts` | - |
| 用戶統計 | `GET /dashboard/users` | `services/dashboard.ts` | - |
| 導出報表 | `GET /dashboard/export` | `services/dashboard.ts` | - |

---

## 🔄 6. 改造現有組件

### **修改 `TelegramLogin.tsx`**

```typescript
// src/pages/TelegramLogin.tsx (修改後)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { telegramLogin } from '@/services/auth';

export default function TelegramLogin() {
  const { login: setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleTelegramAuth = async (userData: any) => {
    try {
      setLoading(true);
      const { token, user } = await telegramLogin(userData);
      localStorage.setItem('token', token);
      setUser(user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('登錄失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  // 原有 Telegram Widget 不變，只需修改 onTelegramAuth 回調
  // onTelegramAuth = (user) => handleTelegramAuth(user);
}
```

### **修改 `Dashboard.tsx`**

```typescript
// src/pages/Dashboard.tsx (修改後)
import { useEffect, useState } from 'react';
import { apiGet } from '@/services/api';
import type { OverviewData } from '@metricgram/shared-types';

export default function Dashboard() {
  const [stats, setStats] = useState<OverviewData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await apiGet('/dashboard/overview');
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  if (!stats) return <div>載入中...</div>;

  return (
    <div>
      <h1>儀表板</h1>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="消息" value={stats.totalMessages} />
        <StatCard title="用戶" value={stats.activeUsers} />
        <StatCard title="Today Msg" value={stats.todayCheckins} />
        <StatCard title="收入" value={`$${stats.totalRevenue}`} />
      </div>
      {/* 圖表 */}
    </div>
  );
}
```

---

## 🚀 7. 快速啟動腳本

在 `app/package.json` 添加腳本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest"
  }
}
```

---

## 📝 8. 注意事項

### **UTF-8 編碼**
- 所有 `.ts` 文件已使用 UTF-8
- 前?端 `index.html` 已包含 `<meta charset="UTF-8">`
- API 響應 `Content-Type: application/json; charset=utf-8`

### **錯誤處理**
- 所有 API 呼叫應捕獲錯誤
- 401 錯誤自動跳轉登入頁
- 顯示友好的錯誤提示

### **類型安全**
- 使用 `@metricgram/shared-types` 提供的類型
- 避免 `any` 類型
- API 返回值使用泛型 `<T>` 指定類型

---

## 🎉 完成！

前?端只需：
1. 安裝共享類型包
2. 創建 `services/` 目錄和 API 客戶端
3. 修改組件調用 API（示例已提供）
4. 配置 `VITE_API_URL` 環境變數

**原有前端代碼大部分可以保持不變**，只需替換硬編碼數據為 API 調用即可。
