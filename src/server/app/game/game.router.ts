import { Router } from 'express';
import { GameController } from './game.controller';

const gameRouter = Router();

// Game status and management
gameRouter.get('/status', GameController.getGameStatus);
gameRouter.post('/start', GameController.startNewGame);
gameRouter.post('/abandon', GameController.abandonGame);

// Game rounds and gameplay
gameRouter.get('/round', GameController.getCurrentRound);
gameRouter.post('/guess', GameController.submitGuess);

// Game information and statistics
gameRouter.get('/stats', GameController.getUserGameStats);
gameRouter.get('/rules', GameController.getGameRules);
gameRouter.get('/leaderboard', GameController.getGameLeaderboard);

export default gameRouter;
