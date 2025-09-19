'use client';

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiResponse,
  GameResult,
  GameStatusResponse,
  Post,
  GuessSubmissionResponse as GuessResult,
} from '../../shared/types/api';

// Types
interface GameStats {
  currentRound: number;
  totalRounds: number;
  correctGuesses: number;
  incorrectGuesses: number;
  currentStreak: number;
  maxStreak: number;
  accuracy: number;
  gameStartTime?: Date;
  isActive: boolean;
}

// Game State
interface GameState {
  // Game Status
  isLoading: boolean;
  hasActiveGame: boolean;
  gameStarted: boolean;
  gameComplete: {
    accuracy: number;
    completedAt: number;
    correctGuesses: number;
    incorrectGuesses: number;
    maxStreak: number;
    rank: number;
    score: number;
    totalRounds: number;
  } | null;
  canStartNewGame: boolean;

  // Current Round
  currentRound: number;
  totalRounds: number;
  posts: Post[];

  // Game Progress
  correctGuesses: number;
  incorrectGuesses: number;
  currentStreak: number;
  maxStreak: number;
  accuracy: number;

  // UI State
  selectedPostId: string | null;
  showResult: boolean;
  lastGuessResult: GuessResult | null;
  feedback: string;

  // Error handling
  error: string | null;

  // Cooldown for starting new game
  timeLeft: number | null;

  // Progress tracking for UI
  guessResults: (boolean | null)[];
}

// Actions
type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_GAME_STATUS'; payload: GameStatusResponse }
  | { type: 'SET_CURRENT_ROUND'; payload: GameResult }
  | { type: 'START_GAME'; payload: GameResult }
  | { type: 'SELECT_POST'; payload: string }
  | { type: 'SUBMIT_GUESS_START' }
  | { type: 'SUBMIT_GUESS_SUCCESS'; payload: GuessResult }
  | { type: 'SUBMIT_GUESS_ERROR'; payload: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'COMPLETE_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'HIDE_RESULT' }
  | { type: 'SET_TIME_LEFT'; payload: number | null };

// Initial State
const initialState: GameState = {
  isLoading: false,
  hasActiveGame: false,
  gameStarted: false,
  gameComplete: null,
  canStartNewGame: true,
  currentRound: 0,
  totalRounds: 10,
  posts: [],
  correctGuesses: 0,
  incorrectGuesses: 0,
  currentStreak: 0,
  maxStreak: 0,
  accuracy: 0,
  selectedPostId: null,
  showResult: false,
  lastGuessResult: null,
  feedback: '',
  error: null,
  timeLeft: null,
  guessResults: Array(10).fill(null),
};

// Reducer
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_GAME_STATUS':
      return {
        ...state,
        hasActiveGame: action.payload.hasActiveGame,
        canStartNewGame: action.payload.canStartNewGame,
        gameStarted: action.payload.hasActiveGame,
      };

    case 'SET_CURRENT_ROUND':
      return {
        ...state,
        currentRound: action.payload.currentRound,
        totalRounds: action.payload.totalRounds,
        posts: action.payload.posts || [],
        correctGuesses: action.payload.correctGuesses,
        incorrectGuesses: action.payload.incorrectGuesses,
        currentStreak: action.payload.streak,
        maxStreak: action.payload.streak,
        gameComplete: action.payload.gameComplete,
        accuracy:
          action.payload.correctGuesses > 0
            ? Math.round(
                (action.payload.correctGuesses /
                  (action.payload.correctGuesses + action.payload.incorrectGuesses)) *
                  100
              )
            : 0,
      };

    case 'START_GAME':
      return {
        ...state,
        gameStarted: true,
        hasActiveGame: true,
        canStartNewGame: false,
        gameComplete: null,
        currentRound: action.payload.currentRound,
        totalRounds: action.payload.totalRounds,
        posts: action.payload.posts || [],
        correctGuesses: 0,
        incorrectGuesses: 0,
        currentStreak: 0,
        maxStreak: 0,
        accuracy: 0,
        selectedPostId: null,
        showResult: false,
        lastGuessResult: null,
        feedback: '',
        error: null,
        timeLeft: null,
        guessResults: Array(action.payload.totalRounds).fill(null),
      };

    case 'SELECT_POST':
      return { ...state, selectedPostId: action.payload };

    case 'SUBMIT_GUESS_START':
      return { ...state, isLoading: true, error: null };

    case 'SUBMIT_GUESS_SUCCESS':
      const newGuessResults = [...state.guessResults];
      const roundIndex = state.currentRound - 1;
      if (roundIndex >= 0 && roundIndex < newGuessResults.length) {
        newGuessResults[roundIndex] = action.payload.correct;
      }
      return {
        ...state,
        isLoading: false,
        showResult: true,
        lastGuessResult: action.payload,
        feedback: action.payload.feedback,
        correctGuesses: action.payload.gameResult.correctGuesses,
        incorrectGuesses: action.payload.gameResult.incorrectGuesses,
        currentStreak: action.payload.gameResult.streak,
        maxStreak: action.payload.gameResult.streak,
        gameComplete: action.payload.gameResult.gameComplete,
        guessResults: newGuessResults,
        accuracy:
          action.payload.gameResult.correctGuesses > 0
            ? Math.round(
                (action.payload.gameResult.correctGuesses /
                  (action.payload.gameResult.correctGuesses +
                    action.payload.gameResult.incorrectGuesses)) *
                  100
              )
            : 0,
      };

    case 'SUBMIT_GUESS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'NEXT_ROUND':
      return {
        ...state,
        selectedPostId: null,
        showResult: false,
        lastGuessResult: null,
        feedback: '',
      };

    case 'COMPLETE_GAME':
      return {
        ...state,

        hasActiveGame: false,
        canStartNewGame: true,
        selectedPostId: null,
        showResult: false,
      };

    case 'RESET_GAME':
      return {
        ...initialState,
        canStartNewGame: true,
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'HIDE_RESULT':
      return { ...state, showResult: false };

    case 'SET_TIME_LEFT':
      return { ...state, timeLeft: action.payload };

    default:
      return state;
  }
}

// Context
interface GameContextType {
  // State
  state: GameState;

  // Actions
  startGame: () => Promise<void>;
  selectPost: (postId: string) => void;
  submitGuess: (postId?: string) => Promise<void>;
  nextRound: () => Promise<void>;
  abandonGame: () => Promise<void>;
  resetGame: () => void;
  clearError: () => void;
  hideResult: () => void;

  // Queries
  refetchGameStatus: () => Promise<void>;

  // Computed properties
  isGameActive: boolean;
  canMakeGuess: boolean;
  roundsRemaining: number;
  gameProgress: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// API Functions
const fetchGameStatus = async (): Promise<ApiResponse<GameStatusResponse>> => {
  const res = await fetch('/api/game/status', {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const fetchCurrentRound = async (): Promise<ApiResponse<GameResult>> => {
  const res = await fetch('/api/game/round', {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const startNewGame = async (): Promise<ApiResponse<GameResult>> => {
  const res = await fetch('/api/game/start', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const submitGuessApi = async (guessPostId: string): Promise<ApiResponse<GuessResult>> => {
  const res = await fetch('/api/game/guess', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ guessPostId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const abandonGameApi = async (): Promise<ApiResponse<void>> => {
  const res = await fetch('/api/game/abandon', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// Provider Component
interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const queryClient = useQueryClient();

  // Game Status Query
  const gameStatusQuery = useQuery({
    queryKey: ['game-status'],
    queryFn: fetchGameStatus,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  });

  // Current Round Query
  const currentRoundQuery = useQuery({
    queryKey: ['current-round'],
    queryFn: fetchCurrentRound,
    enabled: state.hasActiveGame && state.gameStarted,
    refetchOnWindowFocus: false,
  });

  // Start Game Mutation
  const startGameMutation = useMutation({
    mutationFn: startNewGame,
    onSuccess: (response) => {
      if (response.success && response.data) {
        dispatch({ type: 'START_GAME', payload: response.data });
        queryClient.invalidateQueries({ queryKey: ['current-round'] });
      } else {
        const errorMessage = response.error || 'Failed to start game';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });

        // Handle cooldown time from API response
        if (response.data && typeof response.data === 'object' && 'timeLeft' in response.data) {
          dispatch({ type: 'SET_TIME_LEFT', payload: response.data.timeLeft as number });
        }
      }
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to start game';

      if (error.message) {
        if (error.message.includes('HTTP 429')) {
          errorMessage = 'Please wait before starting a new game';
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Server error - please try again later';
        } else if (error.message.includes('HTTP 400')) {
          errorMessage = 'Cannot start game at this time';
        } else {
          errorMessage = error.message;
        }
      }

      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    },
  });

  // Submit Guess Mutation
  const submitGuessMutation = useMutation({
    mutationFn: (guessPostId: string) => submitGuessApi(guessPostId),
    onMutate: () => {
      dispatch({ type: 'SUBMIT_GUESS_START' });
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        dispatch({ type: 'SUBMIT_GUESS_SUCCESS', payload: response.data });
      } else {
        dispatch({
          type: 'SUBMIT_GUESS_ERROR',
          payload: response.error || 'Failed to submit guess',
        });
      }
    },
    onError: (error: any) => {
      dispatch({ type: 'SUBMIT_GUESS_ERROR', payload: error.message || 'Failed to submit guess' });
    },
  });

  // Abandon Game Mutation
  const abandonGameMutation = useMutation({
    mutationFn: abandonGameApi,
    onSuccess: () => {
      dispatch({ type: 'RESET_GAME' });
      queryClient.invalidateQueries({ queryKey: ['game-status'] });
    },
    onError: (error: any) => {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to abandon game' });
    },
  });

  // Effects
  useEffect(() => {
    if (gameStatusQuery.data?.success && gameStatusQuery.data.data) {
      dispatch({ type: 'SET_GAME_STATUS', payload: gameStatusQuery.data.data });
    }
    if (gameStatusQuery.error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load game status' });
    }
  }, [gameStatusQuery.data, gameStatusQuery.error]);

  useEffect(() => {
    if (currentRoundQuery.data?.success && currentRoundQuery.data.data) {
      dispatch({ type: 'SET_CURRENT_ROUND', payload: currentRoundQuery.data.data });
    }
    if (currentRoundQuery.error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load current round' });
    }
  }, [currentRoundQuery.data, currentRoundQuery.error]);

  useEffect(() => {
    dispatch({
      type: 'SET_LOADING',
      payload: gameStatusQuery.isLoading || currentRoundQuery.isLoading,
    });
  }, [gameStatusQuery.isLoading, currentRoundQuery.isLoading]);

  // Countdown timer effect for cooldown
  useEffect(() => {
    if (state.timeLeft && state.timeLeft > 0) {
      const timer = setInterval(() => {
        dispatch({ type: 'SET_TIME_LEFT', payload: Math.max(0, (state.timeLeft || 0) - 1) });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.timeLeft]);

  // Context Methods
  const startGame = async () => {
    try {
      await startGameMutation.mutateAsync();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const selectPost = (postId: string) => {
    dispatch({ type: 'SELECT_POST', payload: postId });
  };

  const submitGuess = async (postId?: string) => {
    console.log('[v0] Submitting guess for post:', postId || state.selectedPostId);
    const guessPostId = postId || state.selectedPostId;

    if (!guessPostId) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select a post first' });
      return;
    }

    try {
      await submitGuessMutation.mutateAsync(guessPostId);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const nextRound = async () => {
    dispatch({ type: 'NEXT_ROUND' });

    if (state.gameComplete) {
      dispatch({ type: 'COMPLETE_GAME' });
      return;
    }

    // Refetch current round data
    try {
      await queryClient.invalidateQueries({ queryKey: ['current-round'] });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load next round' });
    }
  };

  const abandonGame = async () => {
    try {
      await abandonGameMutation.mutateAsync();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hideResult = () => {
    dispatch({ type: 'HIDE_RESULT' });
  };

  const refetchGameStatus = async () => {
    await gameStatusQuery.refetch();
  };

  // Computed properties
  const isGameActive = state.hasActiveGame && state.gameStarted && !state.gameComplete;
  const canMakeGuess =
    isGameActive && state.selectedPostId !== null && !state.isLoading && !state.showResult;
  const roundsRemaining = Math.max(0, state.totalRounds - state.currentRound);
  const gameProgress = state.totalRounds > 0 ? (state.currentRound / state.totalRounds) * 100 : 0;

  const contextValue: GameContextType = {
    state,
    startGame,
    selectPost,
    submitGuess,
    nextRound,
    abandonGame,
    resetGame,
    clearError,
    hideResult,
    refetchGameStatus,
    isGameActive,
    canMakeGuess,
    roundsRemaining,
    gameProgress,
  };

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
}

// Hook to use the game context
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Additional hooks for specific functionality
export function useGameStats(): GameStats {
  const { state } = useGame();

  return {
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    correctGuesses: state.correctGuesses,
    incorrectGuesses: state.incorrectGuesses,
    currentStreak: state.currentStreak,
    maxStreak: state.maxStreak,
    accuracy: state.accuracy,
    isActive: state.hasActiveGame,
  };
}

export function useGameActions() {
  const {
    startGame,
    selectPost,
    submitGuess,
    nextRound,
    abandonGame,
    resetGame,
    clearError,
    hideResult,
  } = useGame();

  return {
    startGame,
    selectPost,
    submitGuess,
    nextRound,
    abandonGame,
    resetGame,
    clearError,
    hideResult,
  };
}
