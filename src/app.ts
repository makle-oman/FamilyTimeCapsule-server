import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import Database from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares';
import { logger } from './utils/logger';

// 验证配置
validateConfig();

const app = express();

// ============================================================
// 全局中间件
// ============================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（上传文件）
app.use('/uploads', express.static(config.upload.dir));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================================
// API 路由
// ============================================================
app.use('/api', routes);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// 错误处理
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================
// 启动服务
// ============================================================
async function bootstrap() {
  try {
    // 连接数据库
    await Database.connect();
    logger.info('数据库连接成功');

    // 启动HTTP服务
    app.listen(config.port, () => {
      logger.info(`服务启动成功: http://localhost:${config.port}`);
      logger.info(`环境: ${config.env}`);
    });
  } catch (error) {
    logger.error('服务启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGINT', async () => {
  logger.info('收到终止信号，正在关闭...');
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('收到终止信号，正在关闭...');
  await Database.disconnect();
  process.exit(0);
});

bootstrap();

export default app;
