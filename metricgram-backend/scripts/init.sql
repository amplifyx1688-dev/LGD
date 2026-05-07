-- PostgreSQL 初始化脚本（UTF-8）
-- Metricgram Database Initialization
-- 執行：psql -U metricgram -d metricgram -f scripts/init.sql

-- 確保 UTF8 編碼
SET client_encoding = 'UTF8';

-- 1. 基本檢查
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'metricgram') THEN
    RAISE NOTICE 'Database metricgram does not exist. Create it manually.';
  END IF;
END $$;

-- 2. 創建必要擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. 確保 tabel exist（Prisma migrate done）
-- 此處僅添加初始數據

-- 4. 插入模塊定義（如果不存在）
INSERT INTO modules (name, display_name, description, is_enabled, is_global_enabled, sort_order)
VALUES 
  ('boot', '開機模塊', '機器人啟動提醒', false, true, 1),
  ('activity', '活動模塊', '晚間活動、二簽活動', false, true, 2),
  ('broadcast', '私信廣播', '中午、紅包、臨時廣播', false, true, 3),
  ('night', '夜間模塊', '夜間模式、靜音規則', false, true, 4),
  ('verify', '驗證模塊', '入群、私信、關注驗證', false, true, 5),
  ('checkin', '簽到模塊', '每日簽到、個人詳情、輪盤', false, true, 6),
  ('forward', '搬運模塊', '文章搬運、關鍵詞過濾', false, true, 7),
  ('dice', '骰子模塊', '骰子遊戲、對戰、結算', false, true, 8),
  ('carousel', '輪播模塊', '多頻道消息輪播', false, true, 9),
  ('clean', '清潔模塊', '消息自動清理', false, true, 10),
  ('dashboard', '儀表板', '數據統計、報表', false, true, 11),
  ('wallet', '錢包模塊', 'USDT 餘額管理', false, true, 12)
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 5. 骰子全局設置（多赔率）
INSERT INTO game_settings (settings_key, settings_value, is_global)
VALUES (
  'global_dice_settings',
  '{
    "commissionRate": 0.05,
    "minBet": 1,
    "maxBet": 1000,
    "allowDoubleBet": true,
    "multipliers": {
      "niu_niu": 5,
      "niu_9": 4,
      "niu_8": 4,
      "niu_7": 4,
      "niu_6": 2,
      "niu_5": 2,
      "niu_4": 2,
      "niu_3": 2,
      "niu_2": 2,
      "niu_1": 2,
      "iron_straight": 5,
      "pair": 2
    }
  }'::jsonb,
  true
) ON CONFLICT (group_id, settings_key) WHERE group_id IS NULL DO NOTHING;

-- 6. 簽到設置
INSERT INTO module_configs (module_id, group_id, config_json)
SELECT 
  m.id,
  NULL,
  '{"dailyPoints": 1, "streakBonus": {3: 1, 5: 2, 7: 3}}'::jsonb
FROM modules m WHERE m.name = 'checkin' AND NOT EXISTS (
  SELECT 1 FROM module_configs WHERE module_id = m.id AND group_id IS NULL
);

-- 7. 轮播默認配置
INSERT INTO module_configs (module_id, group_id, config_json)
SELECT 
  m.id,
  NULL,
  '{
    "intervalSeconds": 5,
    "startIndex": 0,
    "enabledChannels": ["advertisement", "chat", "checkin"],
    "timeWindows": {
      "voiceEnabled": {"start": "08:00", "end": "22:00"},
      "silentEnabled": {"start": "22:00", "end": "08:00"}
    }
  }'::jsonb
FROM modules m WHERE m.name = 'carousel' AND NOT EXISTS (
  SELECT 1 FROM module_configs WHERE module_id = m.id AND group_id IS NULL
);

-- 8. 輪盤獎項配置（可選單獨表，目前使用 game_settings）
INSERT INTO game_settings (settings_key, settings_value, is_global)
VALUES (
  'wheel_prizes',
  '[
    {"type": "一等獎", "probability": 0.0001, "amount": 8888},
    {"type": "二等獎", "probability": 0.001,  "amount": 888},
    {"type": "三等獎", "probability": 0.005,  "amount": 588},
    {"type": "四等獎", "probability": 0.01,   "amount": 188},
    {"type": "五等獎", "probability": 0.03,   "amount": 88},
    {"type": "六等獎", "probability": 0.03,   "amount": 18},
    {"type": "七等獎", "probability": 0.07,   "amount": 10},
    {"type": "八等獎", "probability": 0.15,   "amount": 5},
    {"type": "九等獎", "probability": 0.2939, "amount": 3},
    {"type": "十等獎", "probability": 0.2939, "amount": 1},
    {"type": "再接再厲", "probability": 0.40,  "amount": 0}
  ]'::jsonb,
  true
) ON CONFLICT (group_id, settings_key) WHERE group_id IS NULL DO NOTHING;

-- 9. 創建系統管理員用戶（示例）
INSERT INTO users (telegram_id, username, first_name, last_name, points, balance_usdt, is_verified)
VALUES 
  (0, 'system', 'System', 'Admin', 999999, 99999.9999, true)
ON CONFLICT (telegram_id) DO UPDATE SET 
  username = EXCLUDED.username;

-- 10. 創建系統配置
INSERT INTO system_configs (key, value)
VALUES 
  ('app_name', '"Metricgram"'),
  ('version', '"1.0.0"'),
  ('default_language', '"zh-TW"')
ON CONFLICT (key) DO NOTHING;

-- 11. 創建定時任務
INSERT INTO scheduled_tasks (task_name, cron_expression, task_type, task_config, is_enabled)
VALUES 
  ('carousel_scheduler', '*/5 * * * *', 'carousel', '{"groupId": null}', true),
  ('broadcast_noon', '0 11 * * *', 'broadcast', '{"type": "noon"}', true),
  ('broadcast_red_envelope', '0 17 * * *', 'broadcast', '{"type": "red_envelope"}', true),
  ('night_mode_switch', '0 0 * * *', 'night', '{"action": "enable_night_mode"}', true)
ON CONFLICT (task_name) DO UPDATE SET 
  is_enabled = EXCLUDED.is_enabled;

-- 完成
SELECT '✅ Database initialized successfully at ' || NOW() as message;
