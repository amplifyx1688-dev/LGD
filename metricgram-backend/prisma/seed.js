"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const client_1 = require("@prisma/client");
const contentService_1 = require("@/modules/carousel/services/contentService");
const prisma = new client_1.PrismaClient();
/**
 * 系統初始化腳本
 * 創建默認配置數據
 *
 * 注意：UTF-8 字符串，無 BOM
 */
async function seedDatabase() {
    console.log('🌱 開始數據庫種子...');
    try {
        // 1. 創建默認模塊
        await createDefaultModules();
        // 2. 創建骰子默認賠率
        await createDefaultGameSettings();
        // 3. 創建輪播默認內容（你可以以後修改）
        await createDefaultCarouselContent();
        // 4. 創建按鈕處理器映射
        await createButtonHandlers();
        console.log('✅ 數據庫初始化完成');
    }
    catch (error) {
        console.error('❌ 數據庫初始化失敗:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
/**
 * 創建默認模塊定義
 */
async function createDefaultModules() {
    const modules = [
        { name: 'boot', displayName: '開機模塊', description: '機器人啟動提醒' },
        { name: 'activity', displayName: '活動模塊', description: '晚間活動、二簽活動' },
        { name: 'broadcast', displayName: '私信廣播', description: '中午、紅包、臨時廣播' },
        { name: 'night', displayName: '夜間模塊', description: '夜間模式、靜音規則' },
        { name: 'verify', displayName: '驗證模塊', description: '入群、私信、關注驗證' },
        { name: 'checkin', displayName: '簽到模塊', description: '每日簽到、個人詳情、輪盤' },
        { name: 'forward', displayName: '搬運模塊', description: '文章搬運、關鍵詞過濾' },
        { name: 'dice', displayName: '骰子模塊', description: '骰子遊戲、對戰、結算' },
        { name: 'carousel', displayName: '輪播模塊', description: '多頻道消息輪播' },
        { name: 'clean', displayName: '清潔模塊', description: '消息自動清理' },
        { name: 'dashboard', displayName: '儀表板', description: '數據統計、報表' },
        { name: 'wallet', displayName: '錢包模塊', description: 'USDT 餘額管理' }
    ];
    for (const mod of modules) {
        await prisma.module.upsert({
            where: { name: mod.name },
            update: {},
            create: {
                name: mod.name,
                displayName: mod.displayName,
                description: mod.description,
                isEnabled: false,
                isGlobalEnabled: true, // 全局可用，具體群組可關閉
                configSchema: {},
                sortOrder: getModuleSortOrder(mod.name)
            }
        });
        console.log(`  ✓ 模塊創建: ${mod.name}`);
    }
}
/**
 * 創建骰子默認遊戲設置
 */
async function createDefaultGameSettings() {
    // 全局佣金率
    await prisma.gameSetting.upsert({
        where: { id: 1 }, //  simplified
        update: {},
        create: {
            id: 1,
            settingsKey: 'global_dice_settings',
            settingsValue: JSON.stringify({
                commissionRate: 0.05, // 5%
                multipliers: {
                    niu_niu: 5,
                    niu_9: 4,
                    niu_8: 4,
                    niu_7: 4,
                    niu_6: 2,
                    niu_5: 2,
                    niu_4: 2,
                    niu_3: 2,
                    niu_2: 2,
                    niu_1: 2,
                    iron_straight: 5,
                    pair: 2
                },
                minBet: 1,
                maxBet: 1000,
                allowDoubleBet: true
            }),
            isGlobal: true
        }
    });
    console.log('  ✓ 骰子默認設置創建完成');
}
/**
 * 創建默認輪播內容（基于你提供的配置）
 */
async function createDefaultCarouselContent() {
    const contentService = new contentService_1.ContentService();
    // 1. 骰子版輪播（4個）
    const diceContents = [
        {
            contentKey: '骰子版-001',
            contentType: 'dice',
            content: {
                image: 'account/212-2-1.png',
                text: '<b>🎲 骰子遊戲規則</b>\n\n<b>📌 模式</b>：單場 | 五連 | 包台\n<b>💰 公積金</b>：每場下注 1% 作為紅包池！',
                buttons: [
                    { text: '🎲創建對戰', type: 'callback', value: 'cmd_create_room', row: 0 },
                    { text: '🚫黑單查詢', type: 'callback', value: 'callback_blacklist_check', row: 0 },
                    { text: '📈歷史戰績', type: 'callback', value: 'callback_history_data', row: 0 },
                    { text: '📃規則說明', type: 'callback', value: 'callback_rules_show', row: 1 },
                    { text: '🔙返回主選單', type: 'callback', value: 'back_to_main', row: 1 }
                ]
            }
        },
        {
            contentKey: '骰子版-002',
            contentType: 'dice',
            content: {
                image: 'account/212-2-1.png',
                text: '🎲 【骰子競技場】專業骰子對決...這裡僅收 1%！全自動化系統...🏆 玩法多樣：單顆大小、紅黑單雙、經典牛牛',
                buttons: [
                    { text: '🎲創建對戰', type: 'callback', value: 'cmd_create_room' },
                    { text: '🚫黑單查詢', type: 'callback', value: 'callback_blacklist_check' },
                    { text: '📈歷史戰績', type: 'callback', value: 'callback_history_data' },
                    { text: '📃規則說明', type: 'callback', value: 'callback_rules_show' },
                    { text: '🔙返回主選單', type: 'callback', value: 'back_to_main' }
                ]
            }
        },
        {
            contentKey: '骰子版-003',
            contentType: 'dice',
            content: {
                image: 'account/212-2-1.png',
                text: '🧧 你的下注，我們回饋！全網最佛心 1% 手續費...剩下 9% 差額都是你的利潤空間！集滿 100 直接「全群噴紅包」！',
                buttons: [
                    { text: '🎲創建對戰', type: 'callback', value: 'cmd_create_room' },
                    { text: '🚫黑單查詢', type: 'callback', value: 'callback_blacklist_check' },
                    { text: '📈歷史戰績', type: 'callback', value: 'callback_history_data' },
                    { text: '📃規則說明', type: 'callback', value: 'callback_rules_show' },
                    { text: '🔙返回主選單', type: 'callback', value: 'back_to_main' }
                ]
            }
        },
        {
            contentKey: '骰子版-004',
            contentType: 'dice',
            content: {
                image: 'account/212-3-1.png',
                text: '🎲 骰子老司機首選 🎲...📌 極低手續費：1%...📌 多種人數：2人 | 3人 | 5人 快速開局...💰 特色：公積金紅包機制，玩越多領越多！',
                buttons: [
                    { text: '🎲創建對戰', type: 'callback', value: 'cmd_create_room' },
                    { text: '🚫黑單查詢', type: 'callback', value: 'callback_blacklist_check' },
                    { text: '📈歷史戰績', type: 'callback', value: 'callback_history_data' },
                    { text: '📃規則說明', type: 'callback', value: 'callback_rules_show' },
                    { text: '🔙返回主選單', type: 'callback', value: 'back_to_main' }
                ]
            }
        }
    ];
    for (const item of diceContents) {
        await contentService.upsertContent({
            contentKey: item.contentKey,
            module: 'carousel',
            contentType: item.contentType,
            contentJson: item.content,
            triggerType: 'timer',
            sortOrder: 10 // 骰子輪播排序
        });
        console.log(`  ✓ 輪播內容創建: ${item.contentKey}`);
    }
    // 2. 其他輪播內容（可以後續通過 UI 添加）
    // 這裡只做示範，實際大量內容建議通過管理界面添加
}
/**
 * 創建按鈕處理器映射記錄
 */
async function createButtonHandlers() {
    const handlers = [
        // 簽到模塊
        { key: 'do_signin', name: 'handleCheckin', module: 'checkin', description: '執行簽到' },
        { key: 'profile', name: 'handleProfile', module: 'checkin', description: '查看個人詳情' },
        { key: 'spin_wheel', name: 'handleSpinWheel', module: 'checkin', description: '旋轉獎勵輪盤' },
        { key: 'wheel_prizes', name: 'handleWheelPrizes', module: 'checkin', description: '查看獎項列表' },
        { key: 'back_to_main', name: 'handleBackToMain', module: 'checkin', description: '返回主選單' },
        // 骰子模塊
        { key: 'cmd_create_room', name: 'handleCreateRoom', module: 'dice', description: '創建遊戲房間' },
        { key: 'callback_select_niuniu', name: 'handleSelectNiuniu', module: 'dice', description: '選擇牛牛模式' },
        { key: 'callback_game_start', name: 'handleGameStart', module: 'dice', description: '開始遊戲' },
        { key: 'callback_host_dice', name: 'handleHostDice', module: 'dice', description: '莊家擲骰' },
        { key: 'callback_player_dice', name: 'handlePlayerDice', module: 'dice', description: '閒家擲骰' },
        { key: 'callback_settlement', name: 'handleSettlement', module: 'dice', description: '結算遊戲' },
        { key: 'callback_back_to_game', name: 'handleBackToGame', module: 'dice', description: '返回遊戲' },
        { key: 'callback_mode_normal', name: 'handleModeNormal', module: 'dice', description: '平倍模式' },
        { key: 'callback_mode_double', name: 'handleModeDouble', module: 'dice', description: '翻倍模式' },
        { key: 'callback_rules_show', name: 'handleRulesShow', module: 'dice', description: '顯示規則' },
        { key: 'callback_blacklist_check', name: 'handleBlacklistCheck', module: 'dice', description: '查詢黑單' },
        { key: 'callback_history_data', name: 'handleHistoryData', module: 'dice', description: '查詢歷史戰績' },
        // 其他
        { key: 'close_notice', name: 'handleCloseNotice', module: 'common', description: '關閉通知' },
        { key: 'ad_summary', name: 'handleAdSummary', module: 'forward', description: '廣告事件統整' }
    ];
    for (const h of handlers) {
        await prisma.buttonHandler.upsert({
            where: { handlerKey: h.key },
            update: {},
            create: {
                handlerKey: h.key,
                handlerName: h.name,
                module: h.module,
                description: h.description,
                paramSchema: {},
                requiredPoints: 0,
                rateLimitSeconds: 0,
                isActive: true
            }
        });
        console.log(`  ✓ 處理器映射創建: ${h.key} → ${h.name}`);
    }
}
/**
 * 輔助函數：模塊排序
 */
function getModuleSortOrder(name) {
    const order = {
        boot: 1,
        verify: 2,
        checkin: 3,
        carousel: 4,
        dice: 5,
        broadcast: 6,
        activity: 7,
        forward: 8,
        night: 9,
        clean: 10,
        dashboard: 11,
        wallet: 12
    };
    return order[name] || 99;
}
// 如果直接運行此文件，則執行種子
if (require.main === module) {
    seedDatabase().catch(console.error);
}
//# sourceMappingURL=seed.js.map