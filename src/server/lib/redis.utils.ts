import { redis } from '@devvit/web/server';

export class RedisUtils {
  static async clearRedis() {
    const keys = await redis.hKeys('registry');

    keys.forEach(async (key) => {
      await redis.del(key);
    });
    await redis.hDel('registry', keys);
  }

  static async registerRedisKey(key: string) {
    await redis.hSet('registry', {
      [key]: `${Date.now()}`,
    });
  }
}
