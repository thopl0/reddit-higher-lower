export interface Post {
  id: string;
  title: string;
  url: string;
  subredditName: string;
  score: number;
  thumbnail:
    | undefined
    | {
        url: string;
        height: number;
        width: number;
      };
  body: string | undefined;
  authorName: string;
}

export interface GameStatus {
  subreddits: string[][];
  roundsPlayed: number;
  correctGuesses: number;
  incorrectGuesses: number;
  gameStartTime: number;
  streak: number;
  maxStreak: number;
  isActive: boolean;
}

export interface GameResult {
  posts: Post[] | null;
  gameComplete: any | null;
  currentRound: number;
  totalRounds: number;
  streak: number;
  correctGuesses: number;
  incorrectGuesses: number;
  maxStreak: number;
}
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GameStatusResponse {
  hasActiveGame: boolean;
  gameStatus: GameStatus | null;
  canStartNewGame: boolean;
}

export interface GuessSubmissionRequest {
  guessPostId: string;
}

export interface GuessSubmissionResponse {
  correct: boolean;
  correctPostId: string;
  gameResult: GameResult;
  feedback: string;
}

export interface GuessSubmissionRequest {
  guessPostId: string;
}

export interface UserStat {
  username: string;
  rank: number;
  score: number;
  elo: number;
  correctGuesses: number;
  incorrectGuesses: number;
  streak: number;
  gamesPlayed: number;
}

export interface Leaderboard {
  member: string;
  score: number;
}
