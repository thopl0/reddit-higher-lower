import { useState, useEffect } from 'react';
import { titleConfig } from './user-stat';
import { useLeaderboard } from '../providers/leaderboard-provider';
import { LeaderboardModal } from './leaderboard';

interface GameResultsProps {
  // Current stats (after game completion)
  currentStats: {
    rank: number;
    score: number;
    elo: number;
    correctGuesses: number;
    incorrectGuesses: number;
    streak: number;
    gamesPlayed: number;
  };
  // Previous stats (before the game)
  previousStats: {
    rank: number;
    score: number;
    elo: number;
    correctGuesses: number;
    incorrectGuesses: number;
    streak: number;
    gamesPlayed: number;
  };
  // Game performance
  gameResult: {
    correctAnswers: number;
    totalRounds: number;
    finalStreak: number;
    streakBroken: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  username: string;
}

interface AnimatedStatProps {
  label: string;
  currentValue: number;
  previousValue: number;
  format?: (value: number) => string;
  color?: string;
  delay?: number;
}

function AnimatedStat({
  label,
  currentValue,
  previousValue,
  format = (v) => v.toString(),
  color = 'text-cyan-400',
  delay = 0,
}: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(previousValue);
  const [hasStarted, setHasStarted] = useState(false);

  const change = currentValue - previousValue;
  const isPositive = change > 0;
  const isNegative = change < 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasStarted(true);
      // Animate from previous to current value
      const duration = 1500;
      const steps = 60;
      const stepValue = (currentValue - previousValue) / steps;
      const stepTime = duration / steps;

      let step = 0;
      const interval = setInterval(() => {
        step++;
        const newValue = previousValue + stepValue * step;

        if (step >= steps) {
          setDisplayValue(currentValue);
          clearInterval(interval);
        } else {
          setDisplayValue(Math.round(newValue));
        }
      }, stepTime);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentValue, previousValue, delay]);

  return (
    <div className="text-center">
      <div className="text-gray-400 text-xs font-bold tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color} transition-all duration-500`}>
        {format(displayValue)}
      </div>
      {hasStarted && change !== 0 && (
        <div
          className={`text-sm font-bold mt-1 transition-all duration-500 ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-500'
          }`}
        >
          {isPositive ? '+' : ''}
          {change}
        </div>
      )}
    </div>
  );
}

function getProgressTitles(stats: {
  accuracy: number;
  streak: number;
  rank: number;
  totalGuesses: number;
  gamesPlayed: number;
}) {
  const { accuracy, streak, rank, totalGuesses, gamesPlayed } = stats;

  const categories = [
    { key: 'accuracy', value: accuracy, check: totalGuesses >= 10 },
    { key: 'streak', value: streak, check: true },
    { key: 'rank', value: rank + 1, check: true },
    { key: 'gamesPlayed', value: gamesPlayed, check: true },
  ];

  return categories
    .map(({ key, value, check }) => {
      if (!check) return null;

      const titles = titleConfig[key as keyof typeof titleConfig];
      if (!titles) return null;

      const current = titles.find((t: any) => value >= t.min && value <= t.max);

      let next = null;
      if (key === 'rank') {
        const betterRanks = titles.filter((t: any) => t.min < value);
        if (betterRanks.length > 0) {
          next = betterRanks.reduce((best: any, current: any) =>
            current.min > best.min ? current : best
          );
        }
      } else {
        next = titles.find((t: any) => value < t.min);
      }

      return {
        category: key,
        value,
        current,
        next,
      };
    })
    .filter(Boolean);
}

function TitleProgression({
  currentStats,
  previousStats,
  delay = 0,
}: {
  currentStats: any;
  previousStats: any;
  delay?: number;
}) {
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowProgress(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const currentTotalGuesses = currentStats.correctGuesses + currentStats.incorrectGuesses;
  const currentAccuracy =
    currentTotalGuesses > 0
      ? Math.round((currentStats.correctGuesses / currentTotalGuesses) * 100)
      : 0;

  const previousTotalGuesses = previousStats.correctGuesses + previousStats.incorrectGuesses;
  const previousAccuracy =
    previousTotalGuesses > 0
      ? Math.round((previousStats.correctGuesses / previousTotalGuesses) * 100)
      : 0;

  const currentProgressTitles = getProgressTitles({
    accuracy: currentAccuracy,
    streak: currentStats.streak,
    rank: currentStats.rank,
    totalGuesses: currentTotalGuesses,
    gamesPlayed: currentStats.gamesPlayed,
  });

  const previousProgressTitles = getProgressTitles({
    accuracy: previousAccuracy,
    streak: previousStats.streak,
    rank: previousStats.rank,
    totalGuesses: previousTotalGuesses,
    gamesPlayed: previousStats.gamesPlayed,
  });

  // Find titles that changed
  const changedTitles = currentProgressTitles?.filter((currentTitle) => {
    const previousTitle = previousProgressTitles?.find(
      (p) => p?.category === currentTitle?.category
    );
    return currentTitle?.current?.label !== previousTitle?.current?.label;
  });

  if (!showProgress || !changedTitles?.length) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t border-[#d93900]/30">
      <div className="text-[#d93900]/80 text-sm font-bold mb-3 text-center">
        NEW TITLES UNLOCKED!
      </div>
      <div className="space-y-3">
        {changedTitles.map((title, index) => (
          <div
            key={title?.category}
            className={`bg-gradient-to-r from-[#d93900]/20 to-orange-500/20 border-2 border-[#d93900]/60 p-4 rounded transform transition-all duration-1000 ${
              showProgress ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
            }`}
            style={{
              transitionDelay: `${index * 200}ms`,
              boxShadow: '0 0 20px rgba(217, 57, 0, 0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 uppercase mb-1">{title?.category}</div>
                <div className="text-lg font-bold text-[#d93900] animate-pulse">
                  {title?.current?.label}
                </div>
                <div className="text-xs text-gray-300 mt-1">{title?.current?.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GameResultsModal({
  currentStats,
  previousStats,
  gameResult,
  isOpen,
  onClose,
  onContinue,
  username,
}: GameResultsProps) {
  const [showStats, setShowStats] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showLeaderBoard, setShowLeaderBoard] = useState(false);
  const { data: leaderboard } = useLeaderboard();

  const rankChange = previousStats.rank - currentStats.rank; // Positive means rank improved
  const eloChange = currentStats.elo - previousStats.elo;
  const streakChange = currentStats.streak - previousStats.streak;

  useEffect(() => {
    if (isOpen) {
      setShowStats(false);
      setShowSummary(false);

      const statsTimer = setTimeout(() => setShowStats(true), 500);
      const summaryTimer = setTimeout(() => setShowSummary(true), 2000);

      return () => {
        clearTimeout(statsTimer);
        clearTimeout(summaryTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-black/90 border-2 border-[#d93900]/60 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          fontFamily: 'monospace',
          boxShadow: 'inset 0 0 20px rgba(217, 57, 0, 0.2), 0 0 30px rgba(217, 57, 0, 0.3)',
          clipPath:
            'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-[#d93900] font-bold text-3xl tracking-wider mb-2">
            GAME COMPLETE!
          </div>
          <div className="text-cyan-300 text-lg mb-4">
            {gameResult.correctAnswers}/{gameResult.totalRounds} Correct
            {gameResult.streakBroken ? ' • Streak Broken' : ` • ${gameResult.finalStreak} Streak`}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-all duration-1000 ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Rank Change */}
          <div
            className={`border-2 p-4 text-center transition-all duration-500 ${
              rankChange > 0
                ? 'bg-green-500/20 border-green-400/60'
                : rankChange < 0
                  ? 'bg-red-500/20 border-red-400/60'
                  : 'bg-gray-500/20 border-gray-400/60'
            }`}
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            <AnimatedStat
              label="RANK"
              currentValue={currentStats.rank + 1}
              previousValue={previousStats.rank + 1}
              format={(v) => `#${v}`}
              color={
                rankChange > 0
                  ? 'text-green-400'
                  : rankChange < 0
                    ? 'text-red-400'
                    : 'text-gray-400'
              }
              delay={200}
            />
            {rankChange !== 0 && (
              <div className={`text-xs mt-2 ${rankChange > 0 ? 'text-green-300' : 'text-red-300'}`}>
                {rankChange > 0 ? '↑' : '↓'} {Math.abs(rankChange)} ranks
              </div>
            )}
          </div>

          {/* ELO Change */}
          <div
            className={`border-2 p-4 text-center transition-all duration-500 ${
              eloChange > 0
                ? 'bg-blue-500/20 border-blue-400/60'
                : eloChange < 0
                  ? 'bg-red-500/20 border-red-400/60'
                  : 'bg-gray-500/20 border-gray-400/60'
            }`}
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            <AnimatedStat
              label="SKILL RATING"
              currentValue={currentStats.elo}
              previousValue={previousStats.elo}
              color={
                eloChange > 0 ? 'text-blue-400' : eloChange < 0 ? 'text-red-400' : 'text-gray-400'
              }
              delay={400}
            />
          </div>

          {/* Streak */}
          <div
            className={`border-2 p-4 text-center transition-all duration-500 ${
              gameResult.streakBroken
                ? 'bg-red-500/20 border-red-400/60'
                : streakChange > 0
                  ? 'bg-orange-500/20 border-orange-400/60'
                  : 'bg-gray-500/20 border-gray-400/60'
            }`}
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            <AnimatedStat
              label="STREAK"
              currentValue={currentStats.streak}
              previousValue={previousStats.streak}
              color={gameResult.streakBroken ? 'text-red-400' : 'text-orange-400'}
              delay={600}
            />
            {gameResult.streakBroken && <div className="text-red-300 text-xs mt-2">💔 BROKEN</div>}
          </div>

          {/* Games Played */}
          <div
            className="bg-purple-500/20 border-2 border-purple-400/60 p-4 text-center"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            <AnimatedStat
              label="GAMES PLAYED"
              currentValue={currentStats.gamesPlayed}
              previousValue={previousStats.gamesPlayed}
              color="text-purple-400"
              delay={800}
            />
          </div>
        </div>

        {/* Accuracy Progress Bar */}
        <div
          className={`mb-6 transition-all duration-1000 ${
            showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '1000ms' }}
        >
          <div className="bg-black/40 border border-gray-700 p-4 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm font-bold">ACCURACY</span>
              <span className="text-[#d93900] font-bold">
                {Math.round(
                  (currentStats.correctGuesses /
                    (currentStats.correctGuesses + currentStats.incorrectGuesses)) *
                    100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-800 h-3 rounded">
              <div
                className="bg-gradient-to-r from-[#d93900] to-orange-400 h-3 rounded transition-all duration-2000 ease-out"
                style={{
                  width: `${showStats ? Math.round((currentStats.correctGuesses / (currentStats.correctGuesses + currentStats.incorrectGuesses)) * 100) : 0}%`,
                  transitionDelay: '1200ms',
                }}
              />
            </div>
          </div>
        </div>

        {/* Title Progression */}
        <TitleProgression currentStats={currentStats} previousStats={previousStats} delay={1500} />

        {/* Action Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center mt-8 transition-all duration-1000 ${
            showSummary ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {onContinue && (
            <button
              onClick={() => setShowLeaderBoard(true)}
              className="bg-[#d93900] hover:bg-[#d93900]/80 text-white font-bold px-8 py-4 text-lg border-2 border-[#d93900]/60 shadow-[0_0_20px_rgba(217,57,0,0.4)] transition-all"
              style={{
                clipPath:
                  'polygon(0 0, calc(100% - 8px) 0, 100% 6px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              }}
            >
              VIEW LEADERBOARD
            </button>
          )}
          <button
            onClick={onContinue}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-8 py-4 text-lg border-2 border-gray-500 transition-all"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 8px) 0, 100% 6px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
          >
            CONTINUE
          </button>
        </div>
      </div>
      {showLeaderBoard && (
        <LeaderboardModal
          leaderboardData={leaderboard}
          isOpen={showLeaderBoard}
          onClose={() => setShowLeaderBoard(false)}
          currentUserRank={currentStats.rank}
          currentUserName={username}
        />
      )}
    </div>
  );
}
