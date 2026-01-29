import { PrismaClient } from '@prisma/client';
import { config } from './index';

// 单例模式的 Prisma 客户端
class Database {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!Database.instance) {
      Database.instance = new PrismaClient({
        log: config.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    return Database.instance;
  }

  public static async connect(): Promise<void> {
    const client = Database.getInstance();
    await client.$connect();
  }

  public static async disconnect(): Promise<void> {
    const client = Database.getInstance();
    await client.$disconnect();
  }
}

export const prisma = Database.getInstance();
export default Database;
