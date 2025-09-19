import { Post, reddit, redis } from '@devvit/web/server';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { UserService } from '../user/user.service';
import { GameStatus, GameResult } from '../../../shared/types/api';
import { RedisUtils } from '../../lib/redis.utils';

// Enhanced GameService with UTC-based daily game logic
export class GameService {
  public static readonly subreddits: string[] = [
    'funny',
    'AskReddit',
    'gaming',
    'pics',
    'science',
    'todayilearned',
    'aww',
    'movies',
    'videos',
    'Music',
    'gifs',
    'EarthPorn',
    'Showerthoughts',
    'Jokes',
    'DIY',
    'LifeProTips',
    'food',
    'mildlyinteresting',
    'Art',
    'sports',
    'television',
    'space',
    'nottheonion',
    'photoshopbattles',
    'Documentaries',
    'UpliftingNews',
    'history',
    'Futurology',
    'OldSchoolCool',
    'dataisbeautiful',
    'Fitness',
    'memes',
    'wholesomememes',
    'interestingasfuck',
    'oddlysatisfying',
    'lifehacks',
    'travel',
    'NatureIsFuckingLit',
    'FoodPorn',
    'Unexpected',
    'gardening',
    'photography',
    'mildlyinfuriating',
    'CrappyDesign',
    'GifRecipes',
    'drawing',
    'soccer',
    'woodworking',
    'cars',
    'Eyebleach',
    'BetterEveryLoop',
    'HighQualityGifs',
    'Cooking',
    'MadeMeSmile',
    'recipes',
    'whatisthisthing',
    'YouShouldKnow',
    'battlestations',
    'MealPrepSunday',
    'anime',
    'MemeEconomy',
    'natureismetal',
    'dogs',
    'IdiotsInCars',
    'Awwducational',
    'starterpacks',
    'AmItheAsshole',
    'Outdoors',
    'wallpaper',
    'horror',
    'RoomPorn',
    'comicbooks',
    'PerfectTiming',
    'JusticeServed',
    'Astronomy',
    'CozyPlaces',
    'HistoryMemes',
    'math',
    'changemyview',
    'CampingandHiking',
    'investing',
    'hiking',
    'Economics',
    'ArtefactPorn',
    'Graffiti',
    'BuyItForLife',
    'AccidentalRenaissance',
    'FellowKids',
    'environment',
    'SketchDaily',
    'nextfuckinglevel',
    'EDM',
    'RocketLeague',
    'LivestreamFail',
    'ExposurePorn',
    'technicallythetruth',
    'classicalmusic',
    'LearnUselessTalents',
    'surrealmemes',
    'chemicalreactiongifs',
    'roadtrip',
    'dogswithjobs',
    'evilbuildings',
    'MachinePorn',
    'PenmanshipPorn',
    'Twitch',
    'perfectloops',
    'rareinsults',
    'polandball',
    'WeWantPlates',
    'analog',
    'psychology',
    'antiMLM',
    'audiophile',
    'AnimalTextGifs',
    'AbsoluteUnits',
    'truegaming',
    'CrazyIdeas',
  ];

  private static readonly TOTAL_ROUNDS = 10;
  private static readonly DAILY_GAME_DURATION = 86400000; // 24 hours in milliseconds

  // UTC-based daily keys for true daily games
  private static getDayKey(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  }

  private static getTimeUntilNextDay(): number {
    const now = new Date();
    const tomorrow = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return tomorrow.getTime() - now.getTime();
  }

  // Enhanced Redis keys with UTC-based daily tracking
  private static userGameStatusKey = (username: string) => `user:${username}-game-status`;
  private static roundCorrectGuess = (username: string) => `user:${username}-round-correct-guess`;
  private static dailyCompletionKey = (username: string) =>
    `user:${username}-completed-${GameService.getDayKey()}`;

  // Legacy key for migration purposes
  private static lastCompletedGameKey = (username: string) =>
    `user:${username}-last-completed-game`;

  constructor() {}

  /**
   * Check if user can start a new game today (UTC-based daily reset)
   */
  static async canStartNewGame(): Promise<{
    canStart: boolean;
    reason?: string;
    timeLeft?: number;
  }> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) {
      return { canStart: false, reason: 'User not authenticated' };
    }

    // if (user.username === 'Inevitable-Citron52') {
    //   await redis.set(GameService.dailyCompletionKey(user.username), 'completed');
    // }
    const hasCompletedToday = await redis.get(GameService.dailyCompletionKey(user.username));

    if (hasCompletedToday) {
      const timeLeft = GameService.getTimeUntilNextDay();
      return {
        canStart: false,
        reason: 'You have already completed your daily game',
        timeLeft,
      };
    }

    // Check legacy completion key and migrate if needed
    const legacyCompletedTime = await redis.get(GameService.lastCompletedGameKey(user.username));
    if (legacyCompletedTime) {
      const timeSinceCompletion = Date.now() - parseInt(legacyCompletedTime);
      if (timeSinceCompletion < GameService.DAILY_GAME_DURATION) {
        // Migrate to new daily system
        await redis.set(GameService.dailyCompletionKey(user.username), 'completed');
        await RedisUtils.registerRedisKey(GameService.dailyCompletionKey(user.username));
        await redis.expire(GameService.dailyCompletionKey(user.username), 10);

        const timeLeft = GameService.getTimeUntilNextDay();
        return {
          canStart: false,
          reason: 'You have already completed your daily game',
          timeLeft,
        };
      } else {
        // Clean up old completion record
        await redis.del(GameService.lastCompletedGameKey(user.username));
      }
    }

    // Second, check for active game
    const existingGameStatus = await redis.hGetAll(GameService.userGameStatusKey(user.username));

    if (existingGameStatus && Object.keys(existingGameStatus).length > 0) {
      const gameStartTime = parseInt(existingGameStatus.gameStartTime as string);
      const isExpired = Date.now() - gameStartTime >= GameService.DAILY_GAME_DURATION;

      if (!isExpired) {
        return {
          canStart: false,
          reason: 'You have an active game in progress',
          timeLeft: GameService.DAILY_GAME_DURATION - (Date.now() - gameStartTime),
        };
      } else {
        // Clean up expired active game
        await redis.del(GameService.userGameStatusKey(user.username));
      }
    }

    return { canStart: true };
  }

  /**
   * Check if user can resume an existing game
   */
  static async canResumeGame(): Promise<{
    canResume: boolean;
    gameStatus: GameStatus | undefined;
  }> {
    const gameStatus = await GameService.getGameStatus();

    if (!gameStatus) {
      return { canResume: false, gameStatus: undefined };
    }

    const canResume =
      gameStatus.isActive === true && gameStatus.roundsPlayed < GameService.TOTAL_ROUNDS;

    return {
      canResume,
      gameStatus: canResume ? gameStatus : undefined,
    };
  }

  /**
   * Enhanced method to check daily play status
   */
  static async getDailyPlayStatus(): Promise<{
    hasPlayedToday: boolean;
    hasActiveGame: boolean;
    timeUntilNextGame: number;
    lastPlayTime: number | undefined;
    canResume: boolean;
    currentRound: number | undefined;
  }> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) {
      throw new Error('User not authenticated');
    }

    const hasCompletedToday = await redis.get(GameService.dailyCompletionKey(user.username));
    const activeGame = await redis.hGetAll(GameService.userGameStatusKey(user.username));

    let hasPlayedToday = false;
    let hasActiveGame = false;
    let timeUntilNextGame = 0;
    let lastPlayTime: number | undefined;
    let canResume = false;
    let currentRound: number | undefined;

    // Check for completed game today (UTC-based)
    if (hasCompletedToday) {
      hasPlayedToday = true;
      timeUntilNextGame = GameService.getTimeUntilNextDay();
    }

    // Check for active game
    if (activeGame && Object.keys(activeGame).length > 0) {
      const gameStartTime = parseInt(activeGame.gameStartTime as string);
      const roundsPlayed = parseInt(activeGame.roundsPlayed as string);
      const isExpired = Date.now() - gameStartTime >= GameService.DAILY_GAME_DURATION;

      if (!isExpired && roundsPlayed < GameService.TOTAL_ROUNDS) {
        hasActiveGame = true;
        canResume = true;
        currentRound = roundsPlayed + 1;
        lastPlayTime = gameStartTime;

        if (!hasPlayedToday) {
          timeUntilNextGame = GameService.DAILY_GAME_DURATION - (Date.now() - gameStartTime);
        }
      } else if (isExpired || roundsPlayed >= GameService.TOTAL_ROUNDS) {
        // Clean up expired or completed game
        await GameService.cleanupExpiredGame(user.username);
      }
    }

    return {
      hasPlayedToday,
      hasActiveGame,
      timeUntilNextGame,
      lastPlayTime,
      canResume,
      currentRound,
    };
  }

  /**
   * Start a new daily game with enhanced validation and better error messages
   */
  static async startDailyGame(): Promise<GameResult> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) {
      throw new Error('User not authenticated');
    }

    // Check if user can start a new game
    const canStart = await GameService.canStartNewGame();

    if (!canStart.canStart) {
      if (canStart.timeLeft) {
        const hoursLeft = Math.floor(canStart.timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((canStart.timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        let timeMessage = '';
        if (hoursLeft > 0) {
          timeMessage = `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
          if (minutesLeft > 0) {
            timeMessage += ` and ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
          }
        } else if (minutesLeft > 0) {
          timeMessage = `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
        } else {
          timeMessage = 'less than a minute';
        }

        throw new Error(`${canStart.reason}. Try again in ${timeMessage}.#${canStart.timeLeft}`);
      }
      throw new Error(canStart.reason || 'Cannot start new game');
    }

    // Check if user can resume existing game instead
    const resumeCheck = await GameService.canResumeGame();
    if (resumeCheck.canResume) {
      throw new Error(
        'You have an active game in progress. Resume your current game instead of starting a new one.'
      );
    }

    // Generate random subreddit pairs for all rounds
    const userSubreddits = GameService.generateRandomSubredditPairs();

    // Initialize new game state
    await redis.hSet(GameService.userGameStatusKey(user.username), {
      subreddits: JSON.stringify(userSubreddits),
      roundsPlayed: '0',
      correctGuesses: '0',
      incorrectGuesses: '0',
      gameStartTime: `${Date.now()}`,
      streak: '0',
      maxStreak: '0',
    });

    // Get first round
    return await GameService.getNextRound();
  }

  /**
   * Resume an existing game
   */
  static async resumeGame(): Promise<GameResult> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) {
      throw new Error('User not authenticated');
    }

    const resumeCheck = await GameService.canResumeGame();
    if (!resumeCheck.canResume) {
      throw new Error('No active game to resume. Please start a new game.');
    }

    return await GameService.getNextRound();
  }

  /**
   * Complete game with UTC-based daily tracking
   */
  static async completeGame(username: string, userDailyData: any) {
    try {
      const userStats = await redis.hGetAll(`user:${username}`);

      if (!userDailyData) {
        throw new Error('No Existing Game Data. Please start a new game.');
      }

      const newElo = await LeaderboardService.adjustLeaderboard(
        parseInt(userStats?.elo as string) || 1200,
        parseInt(userDailyData?.maxStreak as string),
        parseInt(userDailyData?.correctGuesses as string),
        parseInt(userDailyData?.incorrectGuesses as string),
        username
      );

      await UserService.updateUserStats(
        username,
        newElo.score,
        parseInt(userDailyData?.correctGuesses as string),
        parseInt(userDailyData?.incorrectGuesses as string)
      );

      // Clean up active game data
      await redis.del(GameService.userGameStatusKey(username));
      await redis.del(GameService.roundCorrectGuess(username));

      // Mark game as completed today (UTC-based)
      await redis.set(GameService.dailyCompletionKey(username), 'completed');
      await RedisUtils.registerRedisKey(username);
      await redis.expire(
        GameService.dailyCompletionKey(username),
        Math.ceil(GameService.getTimeUntilNextDay() / 1000)
      );

      // Clean up legacy completion key
      await redis.del(GameService.lastCompletedGameKey(username));

      return {
        ...newElo,
        totalRounds: 10,
        correctGuesses: parseInt(userDailyData?.correctGuesses as string),
        incorrectGuesses: parseInt(userDailyData?.incorrectGuesses as string),
        maxStreak: parseInt(userDailyData?.maxStreak as string),
        accuracy: Math.round((parseInt(userDailyData?.correctGuesses as string) / 10) * 100),
        completedAt: Date.now(),
      };
    } catch (error) {
      throw new Error(`Failed to complete game: ${error}`);
    }
  }

  /**
   * Updated game status check with UTC-based logic
   */
  static async getGameStatus(): Promise<GameStatus | null> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) return null;

    // Check for active game first
    const gameData = await redis.hGetAll(GameService.userGameStatusKey(user.username));

    console.log(gameData);

    if (gameData && Object.keys(gameData).length > 0) {
      const gameStartTime = parseInt(gameData.gameStartTime as string);
      const roundsPlayed = parseInt(gameData.roundsPlayed as string);
      const isExpired = Date.now() - gameStartTime >= GameService.DAILY_GAME_DURATION;

      if (!isExpired) {
        return {
          subreddits: JSON.parse(gameData.subreddits as string),
          roundsPlayed,
          correctGuesses: parseInt(gameData.correctGuesses as string),
          incorrectGuesses: parseInt(gameData.incorrectGuesses as string),
          gameStartTime,
          streak: parseInt(gameData.streak as string),
          maxStreak: parseInt(gameData.maxStreak as string),
          isActive: roundsPlayed < 10,
        };
      } else {
        // Clean up expired game
        await GameService.cleanupExpiredGame(user.username);
      }
    }

    // Check if user completed game today (UTC-based)
    const hasCompletedToday = await redis.get(GameService.dailyCompletionKey(user.username));

    if (hasCompletedToday) {
      // User completed game today but has no active game
      return {
        subreddits: [],
        roundsPlayed: 10,
        correctGuesses: 0,
        incorrectGuesses: 0,
        gameStartTime: Date.now(),
        streak: 0,
        maxStreak: 0,
        isActive: false,
      };
    }

    return null; // No active or completed game today
  }

  /**
   * Get time until user can play again (UTC-based)
   */
  static async getTimeUntilNextGame(): Promise<number | null> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) return null;

    const canStart = await GameService.canStartNewGame();

    if (canStart.canStart) {
      return 0; // Can play now
    }

    return canStart.timeLeft || null;
  }

  /**
   * Enhanced cleanup method
   */
  private static async cleanupExpiredGame(username: string): Promise<void> {
    await redis.del(GameService.userGameStatusKey(username));
    await redis.del(GameService.roundCorrectGuess(username));
    // Don't delete daily completion key - it should persist until next UTC day
  }

  /**
   * Clean up all user game data (for admin use)
   */
  static async forceCleanupUserGameData(username?: string): Promise<void> {
    const user = username ? { username } : await reddit.getCurrentUser();
    if (!user?.username) {
      throw new Error('User not authenticated');
    }

    await redis.del(GameService.userGameStatusKey(user.username));
    await redis.del(GameService.roundCorrectGuess(user.username));
    await redis.del(GameService.dailyCompletionKey(user.username));
    await redis.del(GameService.lastCompletedGameKey(user.username));
  }

  // [Rest of the existing methods remain the same...]
  static async startNewGame(): Promise<GameResult> {
    return await GameService.startDailyGame();
  }

  static async getNextRound(): Promise<GameResult> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) {
      throw new Error('User not authenticated');
    }

    const gameStatus = await GameService.getGameStatus();
    if (!gameStatus) {
      throw new Error('No active game. Please start a new game.');
    }

    if (gameStatus.roundsPlayed >= GameService.TOTAL_ROUNDS) {
      const completionResult = await GameService.completeGame(user.username, gameStatus);
      return {
        posts: null,
        gameComplete: completionResult,
        currentRound: gameStatus.roundsPlayed,
        totalRounds: GameService.TOTAL_ROUNDS,
        streak: gameStatus.streak,
        correctGuesses: gameStatus.correctGuesses,
        incorrectGuesses: gameStatus.incorrectGuesses,
        maxStreak: gameStatus.maxStreak,
      };
    }

    const roundSubreddits = gameStatus.subreddits[gameStatus.roundsPlayed] as string[];

    try {
      const randomPosts: Post[] = await Promise.all(
        roundSubreddits.map((subreddit) => GameService.getPostFromSubredditName(subreddit))
      );

      const higherScorePostId =
        (randomPosts[0] as Post).score > (randomPosts[1] as Post).score
          ? (randomPosts[0] as Post).id
          : (randomPosts[1] as Post).id;

      await redis.set(GameService.roundCorrectGuess(user.username), higherScorePostId);
      await RedisUtils.registerRedisKey(higherScorePostId);
      return {
        posts: randomPosts,
        gameComplete: null,
        currentRound: gameStatus.roundsPlayed + 1,
        totalRounds: GameService.TOTAL_ROUNDS,
        streak: gameStatus.streak,
        correctGuesses: gameStatus.correctGuesses,
        incorrectGuesses: gameStatus.incorrectGuesses,
        maxStreak: gameStatus.maxStreak,
      };
    } catch (error) {
      throw new Error(`Failed to fetch posts for round: ${error}`);
    }
  }

  static async submitGuess(
    guessPostId: string
  ): Promise<{ correct: boolean; gameResult: GameResult }> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) {
      throw new Error('User not authenticated');
    }

    const correctGuess = await redis.get(GameService.roundCorrectGuess(user.username));
    if (!correctGuess) {
      throw new Error('No active round found');
    }

    const isCorrect = correctGuess === guessPostId;

    await GameService.updateRoundStats(user.username, isCorrect);

    const gameResult = await GameService.getNextRound();

    return {
      correct: isCorrect,
      gameResult,
    };
  }

  private static async updateRoundStats(username: string, isCorrect: boolean): Promise<void> {
    const gameKey = GameService.userGameStatusKey(username);

    if (isCorrect) {
      await redis.hIncrBy(gameKey, 'correctGuesses', 1);

      const currentStreak = await redis.hIncrBy(gameKey, 'streak', 1);
      const maxStreak = parseInt((await redis.hGet(gameKey, 'maxStreak')) || '0');

      if (currentStreak > maxStreak) {
        await redis.hSet(gameKey, {
          maxStreak: `${currentStreak}`,
        });
      }
    } else {
      await redis.hIncrBy(gameKey, 'incorrectGuesses', 1);
      await redis.hSet(gameKey, {
        streak: '0',
      });
    }

    // Increment rounds played
    await redis.hIncrBy(gameKey, 'roundsPlayed', 1);
  }

  private static generateRandomSubredditPairs(): string[][] {
    const pairs: string[][] = [];
    const usedIndices = new Set<string>();

    for (let round = 0; round < GameService.TOTAL_ROUNDS; round++) {
      let firstIndex: number, secondIndex: number;
      let pairKey: string;

      // Ensure unique pairs across all rounds
      do {
        firstIndex = Math.floor(Math.random() * GameService.subreddits.length);
        secondIndex = Math.floor(Math.random() * GameService.subreddits.length);

        // Ensure different subreddits
        if (firstIndex === secondIndex) {
          secondIndex = (secondIndex + 1) % GameService.subreddits.length;
        }

        // Create a consistent key for the pair (smaller index first)
        pairKey = [Math.min(firstIndex, secondIndex), Math.max(firstIndex, secondIndex)].join('-');
      } while (usedIndices.has(pairKey));

      usedIndices.add(pairKey);
      pairs.push([
        GameService.subreddits[firstIndex] as string,
        GameService.subreddits[secondIndex] as string,
      ]);
    }

    return pairs;
  }

  static async getPostFromSubredditName(subredditName: string): Promise<Post> {
    try {
      const posts = reddit.getTopPosts({
        subredditName,
        limit: 20,
        timeframe:
          (['week', 'month'][Math.floor(Math.random() * 3)] as 'month' | 'week') || 'month',
      });

      const postList = await posts.get(1);

      if (!postList || postList.length === 0) {
        throw new Error(`No posts found in subreddit: ${subredditName}`);
      }

      let postListIndeces = [];
      const intialIndex = Math.floor(Math.random() * postList.length);
      let post = postList[intialIndex] as Post;
      const loopBreaker = 0;
      postListIndeces.push(intialIndex);
      while (post.authorName === 'AutoModerator' && loopBreaker < postList.length) {
        let randomIndex = Math.floor(Math.random() * postList.length);
        while (postListIndeces.includes(randomIndex)) {
          randomIndex = Math.floor(Math.random() * postList.length);
        }
        post = postList[randomIndex] as Post;
        postListIndeces.push(randomIndex);
      }

      return post;
    } catch (error) {
      throw new Error(`Failed to fetch post from ${subredditName}: ${error}`);
    }
  }

  static async forceEndGame(): Promise<void> {
    const user = await reddit.getCurrentUser();
    if (!user?.username) {
      throw new Error('User not authenticated');
    }

    await GameService.cleanupExpiredGame(user.username);
  }

  static async getPosts() {
    const posts = reddit.getHotPosts({
      subredditName: 'unpopularopinion',
      limit: 10,
    });

    return await posts.get(10);
  }
}
