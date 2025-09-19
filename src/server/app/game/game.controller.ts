import { Request, Response } from 'express';
import { GameService } from './game.service';
import {
  GuessSubmissionRequest,
  GameResult,
  ApiResponse,
  GameStatusResponse,
  GuessSubmissionResponse,
} from '../../../shared/types/api';

export class GameController {
  /**
   * GET /api/game/status
   * Check current game status for the user
   */
  static async getGameStatus(req: Request, res: Response): Promise<void> {
    try {
      const gameStatus = await GameService.getGameStatus();

      const response: ApiResponse<GameStatusResponse> = {
        success: true,
        data: {
          hasActiveGame: gameStatus !== null && gameStatus.isActive,
          gameStatus,
          canStartNewGame: gameStatus === null || !gameStatus.isActive,
        },
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: `Failed to get game status: ${error}`,
        message: 'Unable to retrieve game status. Please try again.',
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/game/start
   * Start a new daily game
   */
  static async startNewGame(req: Request, res: Response): Promise<void> {
    try {
      // Check if user already has an active game
      const existingGame = await GameService.getGameStatus();

      if (existingGame && existingGame.isActive) {
        const response: ApiResponse = {
          success: false,
          error: 'Active game already exists',
          message: 'You already have an active game. Complete it first or wait for it to expire.',
        };

        res.status(400).json(response);
        return;
      }

      const gameResult = await GameService.startNewGame();

      const response: ApiResponse<GameResult> = {
        success: true,
        data: gameResult,
        message: 'New game started successfully! Good luck!',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: `Failed to start new game: ${(error as Error).message.split('.#')[0]}`,
        message: 'Unable to start a new game. Please try again.',
        data: { timeLeft: (error as Error).message.split('.#')[1] },
      };

      res.json(response);
    }
  }

  /**
   * GET /api/game/round
   * Get posts for the current/next round
   */
  static async getCurrentRound(req: Request, res: Response): Promise<void> {
    try {
      const gameResult = await GameService.getNextRound();

      let message = `Round ${gameResult.currentRound} of ${gameResult.totalRounds}`;

      if (gameResult.gameComplete) {
        message = 'Congratulations! You have completed the daily game.';
      }

      const response: ApiResponse<GameResult> = {
        success: true,
        data: gameResult,
        message,
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: `Failed to get current round: ${error}`,
        message: 'Unable to load round. Please check if you have an active game.',
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/game/guess
   * Submit a guess for the current round
   */
  static async submitGuess(req: Request, res: Response): Promise<void> {
    try {
      const { guessPostId }: GuessSubmissionRequest = req.body;

      if (!guessPostId) {
        const response: ApiResponse = {
          success: false,
          error: 'Missing guess post ID',
          message: 'Please select a post to make your guess.',
        };

        res.status(400).json(response);
        return;
      }

      const result = await GameService.submitGuess(guessPostId);
      const correctPostId = await GameController.getCorrectPostId();

      const feedback = result.correct
        ? GameController.getCorrectGuessFeedback(result.gameResult.streak)
        : GameController.getIncorrectGuessFeedback(
            result.gameResult.correctGuesses,
            result.gameResult.totalRounds
          );

      const response: ApiResponse<GuessSubmissionResponse> = {
        success: true,
        data: {
          correct: result.correct,
          correctPostId: correctPostId || 'unknown',
          gameResult: result.gameResult,
          feedback,
        },
        message: result.correct ? 'Correct guess!' : 'Incorrect guess!',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: `Failed to submit guess: ${error}`,
        message: 'Unable to process your guess. Please try again.',
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/game/stats
   * Get comprehensive game statistics for the user
   */
  static async getUserGameStats(req: Request, res: Response): Promise<void> {
    try {
      const gameStatus = await GameService.getGameStatus();

      if (!gameStatus) {
        const response: ApiResponse = {
          success: true,
          data: {
            hasActiveGame: false,
            message: 'No active game found',
          },
        };

        res.json(response);
        return;
      }

      const stats = {
        currentRound: gameStatus.roundsPlayed + 1,
        totalRounds: 10,
        correctGuesses: gameStatus.correctGuesses,
        incorrectGuesses: gameStatus.incorrectGuesses,
        currentStreak: gameStatus.streak,
        maxStreak: gameStatus.maxStreak,
        accuracy:
          gameStatus.roundsPlayed > 0
            ? Math.round((gameStatus.correctGuesses / gameStatus.roundsPlayed) * 100)
            : 0,
        gameStartTime: gameStatus.gameStartTime,
        isActive: gameStatus.isActive,
      };

      const response: ApiResponse = {
        success: true,
        data: stats,
        message: 'Game statistics retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: `Failed to get game stats: ${error}`,
        message: 'Unable to retrieve game statistics.',
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/game/rules
   * Get game rules and instructions
   */
  static async getGameRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = {
        title: 'Reddit Higher/Lower Game',
        description: 'Guess which Reddit post has a higher score!',
        rules: [
          'Each game consists of 10 rounds',
          "In each round, you'll see two Reddit posts from different subreddits",
          'Your goal is to guess which post has the higher score (upvotes - downvotes)',
          'Correct guesses build your streak and improve your score',
          'Wrong guesses reset your streak',
          'Complete all 10 rounds to finish the game',
          'You can play one game per day',
          'Your final score affects your position on the leaderboard',
        ],
        scoring: {
          correctGuess: 'Increases streak and score',
          incorrectGuess: 'Resets streak',
          maxStreak: 'Best consecutive correct guesses in the game',
          finalScore: 'Based on total correct guesses and max streak',
        },
      };

      const response: ApiResponse = {
        success: true,
        data: rules,
        message: 'Game rules retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: `Failed to get game rules: ${error}`,
        message: 'Unable to retrieve game rules.',
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/game/abandon
   * Force end current game (for emergencies or testing)
   */
  static async abandonGame(req: Request, res: Response): Promise<void> {
    try {
      await GameService.forceEndGame();

      const response: ApiResponse<void> = {
        success: true,
        message: 'Game abandoned successfully. You can start a new game anytime.',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: `Failed to abandon game: ${error}`,
        message: 'Unable to abandon game. Please try again.',
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/game/leaderboard
   * Get current leaderboard (integration point)
   */
  static async getGameLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      // This would integrate with your LeaderboardService
      // const leaderboard = await LeaderboardService.getTopPlayers(10);

      const response: ApiResponse<any[]> = {
        success: true,
        data: [],
        message: 'Leaderboard retrieved successfully',
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: `Failed to get leaderboard: ${error}`,
        message: 'Unable to load leaderboard. Please try again.',
      };

      res.status(500).json(response);
    }
  }

  // Private helper methods
  private static async getCorrectPostId(): Promise<string | null> {
    try {
      // This would need to be implemented to get the correct post ID
      // for feedback purposes (showing which was actually correct)
      return null;
    } catch {
      return null;
    }
  }

  private static getCorrectGuessFeedback(streak: number): string {
    if (streak === 1) return 'Great start! Keep it going!';
    if (streak <= 3) return `Nice! ${streak} in a row!`;
    if (streak <= 5) return `Excellent streak! ${streak} correct guesses!`;
    if (streak <= 7) return `Amazing! You're on fire with ${streak} in a row!`;
    return `Incredible! ${streak} consecutive correct guesses!`;
  }

  private static getIncorrectGuessFeedback(correctGuesses: number, totalRounds: number): string {
    const remaining = totalRounds - (correctGuesses + (totalRounds - correctGuesses));
    if (remaining > 5) return "Don't worry, plenty of rounds left to recover!";
    if (remaining > 2) return 'Keep going! You can still make a comeback!';
    return 'Stay focused for the final rounds!';
  }
}
