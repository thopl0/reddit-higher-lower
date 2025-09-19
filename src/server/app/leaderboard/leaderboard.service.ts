import { reddit, redis } from '@devvit/web/server';

export class LeaderboardService {
  private static readonly BASELINE = 800;
  private static readonly K_DAY = 30;
  private static readonly CAP = 30;
  private static readonly STREAK_BONUS = 0.05;
  private static readonly MAX_STREAK_BONUS = 0.5;
  static async adjustLeaderboard(
    currentElo: number,
    streak: number,
    correctGuesses: number,
    incorrectGuesses: number,
    username: string
  ): Promise<{ rank: number; score: number }> {
    const totalGuesses = correctGuesses + incorrectGuesses;
    const outcome =
      totalGuesses === 0
        ? 0
        : Math.min(correctGuesses, LeaderboardService.CAP) / LeaderboardService.CAP;

    let expected = 0.5 + (currentElo - LeaderboardService.BASELINE) / 4000;
    expected = Math.max(0.2, Math.min(expected, 0.8)); // clamp between 0.2–0.8

    let delta = LeaderboardService.K_DAY * (outcome - expected);

    const streakMultiplier =
      1 + Math.min(streak * LeaderboardService.STREAK_BONUS, LeaderboardService.MAX_STREAK_BONUS);
    delta *= streakMultiplier;

    const newElo = Math.round(currentElo + delta);

    await redis.zAdd('leaderboard', {
      member: username,
      score: newElo,
    });

    return await LeaderboardService.getRankByUsername(username);
  }

  static async getLeaderboard() {
    const leaderboard = await redis.zRange('leaderboard', 0, 999, {
      by: 'rank',
      reverse: true,
      // limit: { offset: 0, count: 1000 },
    });

    return leaderboard;
  }

  static async getUserRank() {
    const user = await reddit.getCurrentUser();
    const total = await redis.zCard('leaderboard');
    const rank = await redis.zRank('leaderboard', user?.username as string);

    const trueRank = total - (rank || 0);

    const userStats = await redis.hGetAll(`user:${user?.username as string}`);

    return {
      username: user?.username,
      rank: trueRank || 0,
      elo: userStats.elo,
      score: userStats.elo,
      correctGuesses: userStats.correctGuesses,
      incorrectGuesses: userStats.incorrectGuesses,
      streak: userStats.streak,
      gamesPlayed: userStats.gamesPlayed,
    };
  }

  static async getRankByUsername(username: string) {
    const [rank, score] = await Promise.all([
      redis.zRank('leaderboard', username as string),
      redis.zScore('leaderboard', username as string),
    ]);

    return { rank: rank || 0, score: score || 0 };
  }
}
