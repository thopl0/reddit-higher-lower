interface UserStatsProps {
  username: string;
  rank: number;
  score: number;
  elo: number;
  correctGuesses: number;
  incorrectGuesses: number;
  streak: number;
  gamesPlayed: number;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// titleConfig.ts
export const titleConfig = {
  streak: [
    { min: 5, max: 9, label: 'Vitamin D Deficient', desc: 'Hit a streak of 5–9.' },
    { min: 10, max: 24, label: 'Terminally Online', desc: 'Streak of 10–24.' },
    { min: 25, max: 49, label: 'Keyboard Warrior', desc: 'Streak of 25–49.' },
    { min: 50, max: 99, label: 'No Life', desc: 'Streak of 50–99.' },
    { min: 100, max: Infinity, label: 'Touch Grass', desc: 'Streak of 100+.' },
  ],
  accuracy: [
    { min: 80, max: 94, label: 'Social Interaction?', desc: 'Accuracy of 80–94%.' },
    { min: 95, max: 99, label: 'Smelly Tryhard', desc: 'Accuracy of 95–99%.' },
    { min: 100, max: 100, label: 'Neckbeard Supreme', desc: 'Accuracy of 100% (10+ guesses).' },
  ],
  rank: [
    { min: 1, max: 1, label: 'Commander Neckbeard', desc: 'Get Rank #1' },
    { min: 2, max: 2, label: 'Head Mod-in-Exile', desc: 'Get Rank #2' },
    { min: 3, max: 3, label: 'Shower Phobia', desc: 'Get Rank #3' },
    { min: 4, max: 4, label: 'Sunlight Avoider', desc: 'Get Rank #4' },
    { min: 5, max: 5, label: 'Chair: Curse of Binding', desc: 'Get Rank #5' },
    { min: 6, max: 6, label: 'Basement Dweller', desc: 'Get Rank #6' },
    { min: 7, max: 7, label: 'Odor Overlord', desc: 'Get Rank #7' },
    { min: 8, max: 8, label: 'Forever Alone', desc: 'Get Rank #8' },
    { min: 9, max: 9, label: 'Erm... Ackshually', desc: 'Get Rank #9' },
    { min: 10, max: 10, label: 'Caffeine Zombie', desc: 'Get Rank #10' },
    { min: 11, max: 500, label: 'J*bless', desc: 'Get Top 500.' },
    { min: 501, max: 1000, label: 'Sad Scroller', desc: 'Get Top 1000.' },
  ],
  gamesPlayed: [
    { min: 50, max: 199, label: 'Get a J*b', desc: 'Played 50–199 games.' },
    {
      min: 200,
      max: 499,
      label: `There's a floor above basement?!`,
      desc: 'Played 200–499 games.',
    },
    { min: 500, max: Infinity, label: 'Lost Cause', desc: 'Played 500+ games.' },
  ],
};

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
    { key: 'rank', value: rank + 1, check: true }, // rank is 0-indexed, but titles use 1-indexed
    { key: 'gamesPlayed', value: gamesPlayed, check: true },
  ];

  return categories
    .map(({ key, value, check }) => {
      if (!check) return null;

      const titles = titleConfig[key as keyof typeof titleConfig];
      if (!titles) return null;

      // Find current
      const current = titles.find((t) => value >= t.min && value <= t.max);

      // For ranks, we need special logic since lower rank numbers are better
      let next = null;
      if (key === 'rank') {
        // For ranks, "next" means a better (lower) rank
        // Find the title with the highest min that's still lower than current value
        const betterRanks = titles.filter((t) => t.min < value);
        if (betterRanks.length > 0) {
          next = betterRanks.reduce((best, current) => (current.min > best.min ? current : best));
        }
      } else {
        // For other stats, find next (first higher min than current value)
        next = titles.find((t) => value < t.min);
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

export function UserStats({
  username,
  rank,
  elo,
  correctGuesses,
  incorrectGuesses,
  streak,
  gamesPlayed,
  isOpen,
  onClose,
}: UserStatsProps) {
  const totalGuesses = correctGuesses + incorrectGuesses;
  const accuracy = totalGuesses > 0 ? Math.round((correctGuesses / totalGuesses) * 100) : 0;
  const progressTitles = getProgressTitles({ accuracy, streak, rank, totalGuesses, gamesPlayed });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-black/90 border-2 border-[#d93900]/60 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          fontFamily: 'monospace',
          boxShadow: 'inset 0 0 20px rgba(217, 57, 0, 0.2), 0 0 30px rgba(217, 57, 0, 0.3)',
          clipPath:
            'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="text-[#d93900] font-bold text-xl tracking-wider">{username}</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#d93900] text-2xl font-bold transition-colors"
            style={{ fontFamily: 'monospace' }}
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Rank */}
          <div
            className="bg-[#d93900]/20 flex flex-col justify-center items-center gap-2 border-2 border-[#d93900]/60 p-4 text-center"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            <div className="text-[#d93900] text-2xl font-bold animate-pulse">#{rank + 1}</div>
            <div className="text-[#d93900]/80 text-xs font-bold tracking-wider">GLOBAL RANK</div>
          </div>

          {/* Score/ELO */}
          <div
            className="bg-gray-500/20 flex flex-col justify-center items-center gap-2 border-2 border-gray-400/60 p-4 text-center"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            <div className="text-gray-300 text-2xl font-bold animate-pulse">{elo}</div>
            <div className="text-gray-400 text-xs font-bold tracking-wider">SKILL RATING</div>
            {/* <div className="text-gray-500 text-xs mt-1">ELO: {elo}</div> */}
          </div>

          {/* Streak */}
          <div
            className="bg-orange-500/20 flex flex-col justify-center items-center gap-2 border-2 border-orange-400/60 p-4 text-center"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            <div className="text-orange-400 text-2xl font-bold animate-pulse">{streak}</div>
            <div className="text-orange-300 text-xs font-bold tracking-wider">CURRENT STREAK</div>
            {streak >= 5 && <div className="text-orange-500 text-xs mt-1"> HOT!</div>}
          </div>

          {/* Games Played */}
          <div
            className="bg-blue-500/20 flex flex-col justify-center items-center gap-2 border-2 border-blue-400/60 p-4 text-center"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          >
            <div className="text-blue-400 text-2xl font-bold animate-pulse">{gamesPlayed}</div>
            <div className="text-blue-300 text-xs font-bold tracking-wider">GAMES PLAYED</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Correct Guesses */}
          <div
            className="bg-green-500/20 flex flex-col justify-center items-center gap-2 border-2 border-green-400/60 p-4 text-center"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
            }}
          >
            <div className="text-green-400 text-xl font-bold">{correctGuesses}</div>
            <div className="text-green-300 text-xs font-bold tracking-wider">CORRECT</div>
          </div>

          {/* Incorrect Guesses */}
          <div
            className="bg-red-500/20 flex flex-col justify-center items-center gap-2 border-2 border-red-400/60 p-4 text-center"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
            }}
          >
            <div className="text-red-400 text-xl font-bold">{incorrectGuesses}</div>
            <div className="text-red-300 text-xs font-bold tracking-wider">INCORRECT</div>
          </div>

          {/* Accuracy */}
          <div
            className="bg-[#d93900]/20 flex flex-col justify-center items-center gap-2 border-2 border-[#d93900]/60 p-4 text-center"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
            }}
          >
            <div className="text-[#d93900] text-xl font-bold">{accuracy}%</div>
            <div className="text-[#d93900]/80 text-xs font-bold tracking-wider">ACCURACY</div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#d93900]/30">
          <div className="text-[#d93900]/80 text-sm font-bold mb-3 text-center">
            TITLE PROGRESSION
          </div>
          <div className="space-y-3">
            {progressTitles?.map((title) => (
              <div key={title?.category} className="bg-black/40 border border-gray-700 p-3 rounded">
                <div className="flex justify-between text-xs mb-1 text-gray-400 uppercase">
                  <span>{title?.category}</span>
                  <span>{title?.value}</span>
                </div>

                <div className="text-sm font-bold text-[#d93900]">
                  {title?.current ? title?.current.label : 'None yet'}
                </div>

                {title?.next ? (
                  <div className="mt-1 text-xs text-gray-400">
                    {title?.category === 'rank' ? (
                      <>
                        Next: <span className="font-bold text-orange-400">{title?.next.label}</span>{' '}
                        (reach rank #{title?.next.min})
                      </>
                    ) : (
                      <>
                        Next: <span className="font-bold text-orange-400">{title?.next.label}</span>{' '}
                        ({title?.value}/{title?.next.min})
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-gray-500 italic">Maxed out</div>
                )}

                {title?.next && title?.category !== 'rank' && (
                  <div className="w-full bg-gray-800 h-2 rounded mt-2">
                    <div
                      className="bg-[#d93900] h-2 rounded"
                      style={{ width: `${Math.min(100, (title?.value / title?.next.min) * 100)}%` }}
                    />
                  </div>
                )}

                {title?.next && title?.category === 'rank' && (
                  <div className="w-full bg-gray-800 h-2 rounded mt-2">
                    <div
                      className="bg-[#d93900] h-2 rounded"
                      style={{
                        width: `${Math.max(0, Math.min(100, 100 - ((title?.value - title?.next.min) / ((title?.current?.min || 0) - title?.next.min)) * 100))}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
