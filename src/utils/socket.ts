import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './logger';

let io: Server | null = null;

/**
 * 初始化 Socket.IO
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // admin 命名空间
  const adminNsp = io.of('/admin');

  adminNsp.on('connection', (socket) => {
    logger.info(`[Socket] 管理后台已连接: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`[Socket] 管理后台已断开: ${socket.id}`);
    });
  });

  logger.info('[Socket] Socket.IO 初始化成功');
  return io;
}

/**
 * 向管理后台推送通知
 */
export function emitAdminNotification(event: string, data: {
  type: 'memory' | 'letter';
  id: string;
  title: string;
  description: string;
  familyName: string;
  authorName: string;
  createdAt: string;
}) {
  if (!io) {
    logger.warn('[Socket] Socket.IO 未初始化，无法推送通知');
    return;
  }

  io.of('/admin').emit(event, data);
  logger.info(`[Socket] 推送通知: ${event} - ${data.title}`);
}
