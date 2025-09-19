import { createContext, useContext, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserStat, Leaderboard } from '../../shared/types/api';

// API functions
async function fetchUserStat(): Promise<UserStat> {
  const res = await fetch('/api/leaderboard/user');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchLeaderboard(): Promise<Leaderboard[]> {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Extended types for game completion tracking
export interface GameCompletionData {
  previousStats: UserStat;
  currentStats: UserStat;
  gameResult: {
    correctAnswers: number;
    totalRounds: number;
    finalStreak: number;
    streakBroken: boolean;
  };
}

// Context types
interface LeaderboardContextType {
  userStat: UserStat | undefined;
  leaderboard: Leaderboard[];
  isLoadingUserStat: boolean;
  isLoadingLeaderboard: boolean;
  isLoading: boolean;
  userStatError: Error | null;
  leaderboardError: Error | null;
  error: Error | null;
  refetchUserStat: () => void;
  refetchLeaderboard: () => void;

  // New fields for game completion tracking
  gameCompletionData: GameCompletionData | null;
  showGameResults: boolean;
  setGameCompletionData: (data: GameCompletionData | null) => void;
  setShowGameResults: (show: boolean) => void;
  capturePreGameStats: () => void;
  recordGameCompletion: (gameResult: {
    correctAnswers: number;
    totalRounds: number;
    finalStreak: number;
    streakBroken: boolean;
  }) => void;
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

// Custom hooks
export function useUserStat() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useUserStat must be used within a LeaderboardProvider');
  }

  return {
    data: context.userStat,
    isLoading: context.isLoadingUserStat,
    error: context.userStatError,
    refetch: context.refetchUserStat,
  };
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }

  return {
    data: context.leaderboard,
    isLoading: context.isLoadingLeaderboard,
    error: context.leaderboardError,
    refetch: context.refetchLeaderboard,
  };
}

export function useGameResults() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useGameResults must be used within a LeaderboardProvider');
  }

  return {
    gameCompletionData: context.gameCompletionData,
    showGameResults: context.showGameResults,
    setGameCompletionData: context.setGameCompletionData,
    setShowGameResults: context.setShowGameResults,
    capturePreGameStats: context.capturePreGameStats,
    recordGameCompletion: context.recordGameCompletion,
  };
}

export function useLeaderboardContext() {
  const context = useContext(LeaderboardContext);
  if (!context) {
    throw new Error('useLeaderboardContext must be used within a LeaderboardProvider');
  }
  return context;
}

export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  // State for tracking game completion
  const [gameCompletionData, setGameCompletionData] = useState<GameCompletionData | null>(null);
  const [showGameResults, setShowGameResults] = useState(false);
  const [preGameStats, setPreGameStats] = useState<UserStat | null>(null);

  // React Query hooks
  const {
    data: userStat,
    isLoading: isLoadingUserStat,
    error: userStatError,
    refetch: refetchUserStat,
  } = useQuery({
    queryKey: ['userStat'],
    queryFn: fetchUserStat,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const {
    data: leaderboard = [],
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Capture stats before a game starts
  const capturePreGameStats = useCallback(() => {
    if (userStat) {
      console.log('Capturing pre-game stats:', userStat);
      setPreGameStats(userStat);
    }
  }, [userStat]);

  // Record game completion and prepare results modal data
  const recordGameCompletion = useCallback(
    async (gameResult: {
      correctAnswers: number;
      totalRounds: number;
      finalStreak: number;
      streakBroken: boolean;
    }) => {
      if (!preGameStats) {
        console.warn('No pre-game stats captured');
        return;
      }

      console.log('Recording game completion with result:', gameResult);
      console.log('Pre-game stats:', preGameStats);

      // Refetch current stats to get updated values
      await refetchUserStat();

      // Wait a bit for the refetch to complete
      setTimeout(() => {
        if (userStat) {
          console.log('Post-game stats:', userStat);

          const completionData: GameCompletionData = {
            previousStats: preGameStats,
            currentStats: userStat,
            gameResult,
          };

          setGameCompletionData(completionData);
          setShowGameResults(true);

          // Clear pre-game stats
          setPreGameStats(null);
        }
      }, 500);
    },
    [preGameStats, userStat, refetchUserStat]
  );

  const contextValue: LeaderboardContextType = {
    userStat,
    leaderboard,
    isLoadingUserStat,
    isLoadingLeaderboard,
    isLoading: isLoadingUserStat || isLoadingLeaderboard,
    userStatError,
    leaderboardError,
    error: userStatError || leaderboardError,
    refetchUserStat,
    refetchLeaderboard,

    // Game completion tracking
    gameCompletionData,
    showGameResults,
    setGameCompletionData,
    setShowGameResults,
    capturePreGameStats,
    recordGameCompletion,
  };

  return <LeaderboardContext.Provider value={contextValue}>{children}</LeaderboardContext.Provider>;
}
