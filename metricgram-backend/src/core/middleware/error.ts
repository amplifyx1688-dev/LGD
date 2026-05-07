import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '@metricgram/shared-types';

/**
 * 錯誤處理 Middleware
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // 默認 500 錯誤
  let statusCode = 500;
  let message = 'Internal server error';

  // 根據錯誤類型返回不同狀態碼
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'AuthenticationError') {
    statusCode = 401;
    message = error.message;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = error.message;
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = error.message;
  }

  // 开发环境显示详细错误
  if (process.env.NODE_ENV === 'development') {
    message = error.message;
  }

  const response: ApiResponse = {
    success: false,
    error: message
  };

  // 如果有原始響應，則返回 JSON
  if (req.accepts('json')) {
    res.status(statusCode).json(response);
  } else {
    res.status(statusCode).send(message);
  }
}

/**
 * 404 處理（放在路由最後）
 */
export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  } as ApiResponse);
}
