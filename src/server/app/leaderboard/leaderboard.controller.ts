import { Request, Response } from 'express';
import { LeaderboardService } from './leaderboard.service';

export class LeaderboardController {
  constructor() {}

  static async getLeaderboard(req: Request, res: Response) {
    const leaderboard: { member: string; score: number }[] =
      await LeaderboardService.getLeaderboard();

    res.status(200).json(leaderboard);
  }

  static async getUserRank(req: Request, res: Response) {
    const rank = await LeaderboardService.getUserRank();

    res.status(200).json(rank);
  }
}
