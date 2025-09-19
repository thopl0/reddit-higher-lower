import { reddit, redis } from '@devvit/web/server';
import { RedisUtils } from '../../lib/redis.utils';

export class UserService {
  static async initUser() {
    const user = await reddit.getCurrentUser();

    await redis.hSet(`user:${user?.username}`, {
      elo: '1000',
      correctGuesses: '0',
      incorrectGuesses: '0',
      gamesPlayed: '0',
      streak: '0',
    });
    await RedisUtils.registerRedisKey(`user:${user?.username}`);
  }

  static async updateUserStats(
    username: string,
    elo: number,
    correctGuesses: number,
    incorrectGuesses: number
  ) {
    const existingUserStats = await redis.hGetAll(`user:${username}`);
    let streak: number = 0;

    if (existingUserStats?.lastPlayDate) {
      const lastPlayDate = parseInt(existingUserStats?.lastPlayDate as string);
      const timeSinceLastPlay = Date.now() - lastPlayDate;
      const daysSinceLastPlay = timeSinceLastPlay / (1000 * 60 * 60 * 24);
      if (daysSinceLastPlay <= 1) {
        streak = parseInt(existingUserStats?.streak as string) + 1;
      }
    }
    await redis.hSet(`user:${username}`, {
      elo: String(elo),
      correctGuesses: existingUserStats?.correctGuesses
        ? String(parseInt(existingUserStats?.correctGuesses as string) + correctGuesses)
        : '0',
      incorrectGuesses: existingUserStats?.incorrectGuesses
        ? String(parseInt(existingUserStats?.incorrectGuesses as string) + incorrectGuesses)
        : '0',
      gamesPlayed: existingUserStats?.gamesPlayed
        ? String(parseInt(existingUserStats?.gamesPlayed as string) + 1)
        : '0',
      streak: String(streak),
      lastPlayDate: String(Date.now()),
    });

    await RedisUtils.registerRedisKey(`user:${username}`);
  }
}
