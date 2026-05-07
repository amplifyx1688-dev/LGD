import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'metricgram-backend' },
  transports: [
    // 每日滾動文件
    new DailyRotateFile({
      filename: path.join(process.env.LOG_DIR || 'logs', 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    }),
    // 錯誤日誌單獨文件
    new DailyRotateFile({
      filename: path.join(process.env.LOG_DIR || 'logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    }),
    // 控制台輸出（開發環境）
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * HTTP 請求日誌 Middleware
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.userId
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP request warning', logData);
    } else {
      logger.info('HTTP request', logData);
    }
  });

  next();
}
