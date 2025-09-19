'use client';

import { useGame } from '../../providers/game-provider';
import { useGameResults, useUserStat } from '../../providers/leaderboard-provider';
import { PostCard } from '../../components/post-card';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameResultsModal } from '../../components/game-result';
import type { UserStat } from '../../../shared/types/api';

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
};

export default function DailyGame() {
  const navigate = useNavigate();
  const [initialUserData, setInitialUserData] = useState<UserStat | null>(null);
  const { state, startGame, selectPost, submitGuess, nextRound } = useGame();
  const { data: userStat, refetch: refetchUserStat, isLoading: isLoadingUserStat } = useUserStat();
  const {
    showGameResults,
    setShowGameResults,
    capturePreGameStats,
    recordGameCompletion,
    gameCompletionData,
  } = useGameResults();

  useEffect(() => {
    refetchUserStat();
    if (userStat === null && userStat !== undefined) {
      console.log('setting initial user data');
      setInitialUserData(userStat);
    }
  }, [userStat, refetchUserStat]);

  console.log(initialUserData);

  // Local state for optimistic updates
  const [optimisticGuess, setOptimisticGuess] = useState<{
    selectedPostId: string;
    isCorrect: boolean;
    correctPostId: string;
    scoreDifference: number;
    selectedPostScore: number;
    otherPostScore: number;
  } | null>(null);
  const [showingResult, setShowingResult] = useState(false);
  const [isLoadingNextRound, setIsLoadingNextRound] = useState(false);

  const handleGuess = async (guessPostId: string) => {
    if (!state.posts || state.posts.length !== 2) return;

    const postA = state.posts[0];
    const postB = state.posts[1];
    const correctPostId =
      (postA?.score || 0) > (postB?.score || 0) ? postA?.id || '' : postB?.id || '';
    const isCorrect = guessPostId === correctPostId;

    const selectedPost = state.posts.find((p) => p.id === guessPostId);
    const otherPost = state.posts.find((p) => p.id !== guessPostId);
    const scoreDifference = Math.abs((selectedPost?.score || 0) - (otherPost?.score || 0));

    setOptimisticGuess({
      selectedPostId: guessPostId,
      isCorrect,
      correctPostId,
      scoreDifference,
      selectedPostScore: selectedPost?.score || 0,
      otherPostScore: otherPost?.score || 0,
    });
    setShowingResult(true);

    // Select and submit guess
    selectPost(guessPostId);
    await submitGuess(guessPostId);
    setIsLoadingNextRound(true);
    await nextRound();
    setIsLoadingNextRound(false);
  };

  const handleStartGame = async () => {
    capturePreGameStats();
    await startGame();
  };

  // Handle game completion - FIXED
  useEffect(() => {
    if (state.gameComplete && !showGameResults) {
      const gameResult = {
        correctAnswers: state.correctGuesses,
        totalRounds: state.totalRounds,
        finalStreak: state.currentStreak,
        streakBroken: state.currentStreak === 0 && state.correctGuesses < state.totalRounds,
      };

      // Add a small delay to show the completion message briefly
      const timer = setTimeout(() => {
        recordGameCompletion(gameResult);
        setShowGameResults(true); // Force show results
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    state.gameComplete,
    showGameResults,
    state.correctGuesses,
    state.totalRounds,
    state.currentStreak,
    recordGameCompletion,
    setShowGameResults,
  ]);

  useEffect(() => {
    setShowingResult(false);
    setOptimisticGuess(null);
  }, [JSON.stringify(state.posts)]);

  const handleGameResultsClose = () => {
    setShowGameResults(false);
  };

  const handleGameResultsContinue = () => {
    setShowGameResults(false);
    navigate('/leaderboard');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // Show game results modal if available
  if (showGameResults && gameCompletionData && state.gameComplete && !isLoadingUserStat) {
    return (
      <GameResultsModal
        currentStats={{
          rank: userStat?.rank || 0,
          score: userStat?.score || 0,
          elo: userStat?.elo || 0,
          correctGuesses: userStat?.correctGuesses || 0,
          incorrectGuesses: userStat?.incorrectGuesses || 0,
          streak: userStat?.streak || 0,
          gamesPlayed: userStat?.gamesPlayed || 0,
        }}
        previousStats={{
          rank: gameCompletionData.previousStats.rank,
          score: gameCompletionData.previousStats.score,
          elo: gameCompletionData.previousStats.elo,
          correctGuesses: gameCompletionData.previousStats.correctGuesses,
          incorrectGuesses: gameCompletionData.previousStats.incorrectGuesses,
          streak: gameCompletionData.previousStats.streak,
          gamesPlayed: gameCompletionData.previousStats.gamesPlayed,
        }}
        gameResult={{
          correctAnswers: state.gameComplete.correctGuesses,
          finalStreak: state.gameComplete.maxStreak,
          streakBroken: state.gameComplete.maxStreak === state.gameComplete?.totalRounds,
          totalRounds: state.gameComplete.totalRounds,
        }}
        isOpen={showGameResults}
        onClose={handleGameResultsClose}
        onContinue={handleGameResultsContinue}
        username={userStat?.username || ''}
      />
    );
  }

  if (state.error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'monospace',
        }}
      >
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-400 font-bold text-2xl sm:text-4xl mb-4 animate-pulse">
            ERROR
          </div>
          <div className="text-red-300 text-base sm:text-lg mb-6 break-words bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
            {state.error}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 sm:px-6 sm:py-3 border-2 border-red-400 rounded-lg text-sm sm:text-base transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-400/30"
            >
              RETRY
            </button>
            <button
              onClick={handleBackToHome}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 sm:px-6 sm:py-3 border-2 border-gray-500 rounded-lg text-sm sm:text-base transition-all duration-200 hover:scale-105"
            >
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!state.gameStarted && !state.isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'monospace',
        }}
      >
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="text-orange-400 font-bold text-2xl sm:text-4xl mb-4 tracking-wider animate-pulse">
              REDDIT HIGHER OR LOWER
            </div>
            <div className="text-cyan-200 text-base sm:text-lg mb-6">
              Guess which Reddit post has more upvotes!
            </div>
            <div className="text-cyan-300 text-xs sm:text-sm space-y-2 mb-8 bg-black/40 p-4 sm:p-6 rounded-lg border border-cyan-500/30 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                <span>Compare upvotes between two Reddit posts</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span
                  className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                ></span>
                <span>10 rounds per daily game</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span
                  className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                  style={{ animationDelay: '0.4s' }}
                ></span>
                <span>Build your streak and climb the leaderboard</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span
                  className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                  style={{ animationDelay: '0.6s' }}
                ></span>
                <span>One game per day - make it count!</span>
              </div>
            </div>
          </div>

          {state.timeLeft && state.timeLeft > 0 ? (
            <div className="bg-black/60 border-2 border-red-500/40 p-4 sm:p-6 mb-6 rounded-lg backdrop-blur-sm">
              <div className="text-red-400 font-bold mb-2 text-sm sm:text-base animate-pulse">
                COOLDOWN ACTIVE
              </div>
              <div className="text-red-300 text-2xl sm:text-3xl font-mono mb-2 tabular-nums">
                {formatTime(state.timeLeft)}
              </div>
              <div className="text-red-300 text-xs sm:text-sm">
                Please wait before starting a new game
              </div>
            </div>
          ) : (
            <button
              onClick={handleStartGame}
              disabled={state.isLoading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl border-2 border-orange-400 shadow-lg shadow-orange-400/20 rounded-lg transition-all duration-200 hover:shadow-orange-400/40 hover:scale-105 mb-6 w-full sm:w-auto group"
            >
              <span className="group-hover:animate-pulse">
                {state.isLoading ? 'STARTING...' : 'START DAILY GAME'}
              </span>
            </button>
          )}

          <div>
            <button
              onClick={handleBackToHome}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 sm:px-6 sm:py-3 border-2 border-gray-500 rounded-lg transition-all duration-200 text-sm sm:text-base w-full sm:w-auto hover:scale-105"
            >
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.isLoading && !state.gameStarted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'monospace',
        }}
      >
        <div className="text-center max-w-md mx-auto">
          <div className="text-orange-400 text-xl sm:text-2xl font-bold mb-4 animate-pulse">
            LOADING GAME...
          </div>
          <div className="text-cyan-300 mb-4 text-sm sm:text-base">
            Preparing your daily challenge...
          </div>
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full"></div>
            <div
              className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full"
              style={{ animationDelay: '0.2s' }}
            ></div>
            <div
              className="animate-spin w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full"
              style={{ animationDelay: '0.4s' }}
            ></div>
          </div>
          <div className="text-xs text-cyan-400 animate-pulse">Fetching fresh Reddit posts...</div>
        </div>
      </div>
    );
  }

  if (isLoadingNextRound) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'monospace',
        }}
      >
        <div className="text-center max-w-md mx-auto">
          <div className="text-orange-400 font-bold text-xl sm:text-2xl lg:text-3xl mb-4 animate-pulse">
            PREPARING NEXT ROUND
          </div>
          <div className="text-cyan-300 mb-6 text-sm sm:text-base lg:text-lg">
            Loading fresh Reddit posts...
          </div>
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full"></div>
          </div>
          <div className="text-xs text-cyan-400 animate-pulse">
            Round {state.currentRound} of {state.totalRounds}
          </div>
        </div>
      </div>
    );
  }

  if (state.gameStarted && state.posts && !state.gameComplete) {
    return (
      <div
        className="min-h-screen"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'monospace',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-4">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="mb-3 sm:mb-6">
              <div className="text-orange-400 font-bold text-lg sm:text-2xl lg:text-3xl mb-2 tracking-wider animate-pulse">
                REDDIT HIGHER OR LOWER
              </div>
              {!showingResult && (
                <div className="text-xs sm:text-sm lg:text-base mb-2 sm:mb-4">
                  Which post has{' '}
                  <span className="text-orange-400 font-bold animate-pulse">MORE UPVOTES</span>?
                </div>
              )}
            </div>

            {/* Enhanced Progress Bar */}
            <div className="max-w-lg mx-auto mb-3 sm:mb-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="text-orange-400 font-bold text-xs tabular-nums">
                  ROUND {state.currentRound}/{state.totalRounds}
                </div>
                <div className="text-cyan-400 text-xs tabular-nums">
                  STREAK: {state.currentStreak} | SCORE: {state.correctGuesses}/
                  {state.currentRound - 1}
                </div>
              </div>

              {/* Enhanced Visual Progress with better animations */}
              <div className="flex items-center justify-center gap-1 mb-2 sm:mb-4 p-2 sm:p-4 bg-black/40 border-2 border-orange-500/30 rounded-lg shadow-lg shadow-orange-500/10 overflow-x-auto backdrop-blur-sm">
                {Array.from({ length: state.totalRounds }).map((_, index) => {
                  const roundResult = state.guessResults[index];
                  const isCurrentRound = index === state.currentRound - 1;
                  const isCompleted = index < state.currentRound - 1;

                  return (
                    <div key={index} className="flex items-center flex-shrink-0">
                      <div
                        className={`w-5 h-5 sm:w-8 sm:h-8 border-2 flex items-center justify-center transition-all duration-500 font-bold text-xs rounded ${
                          roundResult === true
                            ? 'bg-orange-500/20 border-orange-400 text-orange-400 shadow-lg shadow-green-400/50 scale-110'
                            : roundResult === false
                              ? 'bg-indigo-500/20 border-indigo-400 text-indigo-400 shadow-lg shadow-red-400/50 animate-shake'
                              : isCurrentRound && showingResult && optimisticGuess
                                ? optimisticGuess.isCorrect
                                  ? 'bg-orange-500/20 border-orange-400 text-orange-400 shadow-lg shadow-green-400/50 scale-110 animate-bounce'
                                  : 'bg-indigo-500/20 border-indigo-400 text-indigo-400 shadow-lg shadow-red-400/50 animate-shake'
                                : isCurrentRound
                                  ? 'border-white-500 bg-white-500/20 text-orange-300 shadow-lg shadow-orange-400/30 animate-pulse scale-105'
                                  : isCompleted
                                    ? 'border-gray-600 bg-gray-800/50 text-gray-400'
                                    : 'border-gray-600 bg-gray-800/50 text-gray-400'
                        }`}
                      >
                        {roundResult === true ||
                        (isCurrentRound && showingResult && optimisticGuess?.isCorrect) ? (
                          <span className="text-orange-400 font-bold text-xs sm:text-sm">↑</span>
                        ) : roundResult === false ||
                          (isCurrentRound &&
                            showingResult &&
                            optimisticGuess &&
                            !optimisticGuess.isCorrect) ? (
                          <span className="text-indigo-400 font-bold text-xs sm:text-sm">↓</span>
                        ) : (
                          <span className="font-bold text-xs tabular-nums">{index + 1}</span>
                        )}
                      </div>
                      {index < state.totalRounds - 1 && (
                        <div
                          className={`w-1 sm:w-4 h-0.5 sm:h-1 transition-all duration-500 ${
                            index < state.currentRound - 1
                              ? 'bg-orange-500 shadow-sm shadow-orange-400/50'
                              : 'bg-gray-600'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Result feedback */}
              {showingResult && optimisticGuess && (
                <div className="">
                  <div
                    className={`text-xl sm:text-2xl lg:text-4xl font-bold animate-bounce ${
                      optimisticGuess.isCorrect ? 'text-orange-400' : 'text-indigo-400'
                    }`}
                  >
                    {optimisticGuess.isCorrect ? 'CORRECT!' : 'INCORRECT!'}
                  </div>
                  <div className="text-cyan-300 text-xs sm:text-sm lg:text-base mb-2">
                    {optimisticGuess.isCorrect
                      ? 'You picked the post with more upvotes!'
                      : 'The other post had more upvotes!'}
                  </div>
                  <div className="text-yellow-300 text-xs sm:text-sm bg-black/30 p-2 rounded-lg border border-yellow-500/20">
                    Your choice:{' '}
                    <span className="font-bold text-white">
                      {optimisticGuess.selectedPostScore > 1000
                        ? `${(optimisticGuess.selectedPostScore / 1000).toFixed(1)}k`
                        : optimisticGuess.selectedPostScore}
                    </span>{' '}
                    upvotes
                    <br />
                    Other post:{' '}
                    <span className="font-bold text-white">
                      {optimisticGuess.otherPostScore > 1000
                        ? `${(optimisticGuess.otherPostScore / 1000).toFixed(1)}k`
                        : optimisticGuess.otherPostScore}
                    </span>{' '}
                    upvotes
                    <br />
                    Difference:{' '}
                    <span className="font-bold text-orange-400">
                      {optimisticGuess.scoreDifference > 1000
                        ? `${(optimisticGuess.scoreDifference / 1000).toFixed(1)}k`
                        : optimisticGuess.scoreDifference}
                    </span>{' '}
                    upvotes
                  </div>
                  <div className="text-cyan-400 text-xs animate-pulse">
                    Next round in 3 seconds...
                  </div>
                </div>
              )}

              {!showingResult && (
                <div className="text-cyan-300 text-xs sm:text-sm mb-2 sm:mb-4 bg-black/30 p-2 sm:p-3 rounded-lg border border-cyan-500/20 backdrop-blur-sm">
                  Click the <span className="text-orange-400 font-bold">↑ UPVOTE</span> or{' '}
                  <span className="text-indigo-400 font-bold">↓ DOWNVOTE</span> buttons to make your
                  guess
                </div>
              )}
            </div>
          </div>

          {/* Posts Grid - Enhanced with better spacing and animations */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-6 lg:gap-8">
            {state.posts.map((post, index) => (
              <div
                key={`${post.id}-${state.currentRound}`}
                className={`space-y-2 sm:space-y-4 transform transition-all duration-500 ${
                  showingResult ? 'scale-100' : 'hover:scale-[1.02]'
                } ${showingResult && index === 0 ? 'hidden' : ''}`}
              >
                <div className="text-center">
                  <div
                    className={`border px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold inline-block rounded-lg transition-all duration-200 ${
                      index === 0
                        ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-100 shadow-sm shadow-cyan-400/30'
                        : 'bg-orange-500/20 border-orange-400/60 text-orange-100 shadow-sm shadow-orange-400/30'
                    }`}
                  >
                    {index === 0 ? 'POST A' : 'POST B'} - r/{post.subredditName}
                  </div>
                </div>
                <PostCard
                  post={post}
                  baseCardScore={state.posts[0]?.score || 0}
                  onUpvote={
                    index === 1 && !showingResult
                      ? () => handleGuess(state.posts[1]?.id || '')
                      : undefined
                  }
                  onDownvote={
                    index === 1 && !showingResult
                      ? () => handleGuess(state.posts[0]?.id || '')
                      : undefined
                  }
                  disabled={showingResult}
                  showScore={index === 0 || showingResult}
                  isBaseCard={index === 0}
                  isSelected={
                    showingResult && optimisticGuess
                      ? optimisticGuess.selectedPostId === post.id
                      : false
                  }
                  isCorrect={
                    showingResult && optimisticGuess && optimisticGuess.selectedPostId === post.id
                      ? optimisticGuess.isCorrect
                      : null
                  }
                  selectedChoice={
                    showingResult &&
                    optimisticGuess &&
                    index === 1 &&
                    optimisticGuess.selectedPostId === post.id
                      ? 'higher'
                      : showingResult &&
                          optimisticGuess &&
                          index === 1 &&
                          optimisticGuess.selectedPostId !== post.id
                        ? 'lower'
                        : null
                  }
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-4 sm:mt-8">
            <button
              onClick={handleBackToHome}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 sm:px-6 sm:py-3 border-2 border-gray-500 rounded-lg transition-all duration-200 text-xs sm:text-base w-full sm:w-auto max-w-xs hover:scale-105"
            >
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.gameComplete && !showGameResults) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
          fontFamily: 'monospace',
        }}
      >
        <div className="text-center max-w-md mx-auto">
          <div className="text-orange-400 font-bold text-2xl sm:text-3xl lg:text-4xl mb-4 tracking-wider animate-pulse">
            GAME COMPLETE!
          </div>
          <div className="text-cyan-200 text-sm sm:text-base lg:text-lg mb-6">
            Calculating your results...
          </div>
          <div className="text-cyan-300 text-sm sm:text-base lg:text-lg mb-8 bg-black/40 p-4 rounded-lg border border-cyan-500/30">
            Final Score:{' '}
            <span className="text-orange-400 font-bold tabular-nums">
              {state.correctGuesses}/{state.totalRounds}
            </span>
          </div>
          <div className="flex justify-center items-center gap-2">
            <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        fontFamily: 'monospace',
      }}
    >
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <div className="text-cyan-300 text-sm sm:text-base">Loading...</div>
      </div>
    </div>
  );
}
