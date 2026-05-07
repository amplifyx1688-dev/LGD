import { startServer } from './app';
import { initBot, stopBot, bot } from './bot';
import { carouselScheduler } from './jobs/carouselScheduler';
import { logger } from './core/utils/logger';

/**
 * 主入口文件
 */

async function main() {
  try {
    logger.info('🚀 Starting Metricgram Backend...');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // 1. 初始化 API 服務器
    startServer();

    // 2. 初始化 Telegram Bot（需要等待服務器啟動）
    setTimeout(async () => {
      await initBot();

      // 2.1 將 bot 實例注入輪播調度器
      carouselScheduler.setBot(bot);

      // 3. 啟動輪播調度器（延遲5秒確保就緒）
      setTimeout(() => {
        carouselScheduler.start(5);
        logger.info('✅ All services started successfully');
      }, 5000);
    }, 1000);

    // 4. 優雅關閉處理
    process.on('SIGINT', async () => {
      logger.info('🛑 Received SIGINT, shutting down...');
      carouselScheduler.stop();
      await stopBot();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 Received SIGTERM, shutting down...');
      carouselScheduler.stop();
      await stopBot();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start application', { error });
    process.exit(1);
  }
}

// 啟動
if (require.main === module) {
  main().catch(console.error);
}
