import { Router } from 'express';
import { LeaderboardController } from './leaderboard.controller';

const leaderboardRouter = Router();

leaderboardRouter.get('/', LeaderboardController.getLeaderboard);
leaderboardRouter.get('/user', LeaderboardController.getUserRank);

export { leaderboardRouter };
