'use client';

import { useState, useEffect, useRef } from 'react';
import type { Leaderboard } from '../../shared/types/api';
import { X } from 'lucide-react';

interface LeaderboardModalProps {
  leaderboardData: Leaderboard[];
  isOpen: boolean;
  onClose: () => void;
  currentUserRank?: number;
  currentUserName?: string;
}

const rankTitles = [
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
];

function getRankTitle(rank: number) {
  return rankTitles.find((title) => rank >= title.min && rank <= title.max);
}

function LeaderboardEntry({
  member,
  score,
  rank,
  isCurrentUser = false,
  delay = 0,
}: {
  member: string;
  score: number;
  rank: number;
  isCurrentUser?: boolean;
  delay?: number;
}) {
  const rankTitle = getRankTitle(rank);

  const getTopRankStyling = () => {
    if (rank === 1) {
      return {
        background:
          'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.1) 100%)',
        border: '2px solid rgba(255, 215, 0, 0.8)',
        boxShadow:
          'inset 0 0 20px rgba(255, 215, 0, 0.2), 0 0 25px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.2)',
        animation: 'pulse 3s ease-in-out infinite',
      };
    } else if (rank === 2) {
      return {
        background:
          'linear-gradient(135deg, rgba(192, 192, 192, 0.15) 0%, rgba(169, 169, 169, 0.1) 100%)',
        border: '2px solid rgba(192, 192, 192, 0.8)',
        boxShadow: 'inset 0 0 15px rgba(192, 192, 192, 0.2), 0 0 20px rgba(192, 192, 192, 0.3)',
      };
    } else if (rank === 3) {
      return {
        background:
          'linear-gradient(135deg, rgba(205, 127, 50, 0.15) 0%, rgba(184, 115, 51, 0.1) 100%)',
        border: '2px solid rgba(205, 127, 50, 0.8)',
        boxShadow: 'inset 0 0 15px rgba(205, 127, 50, 0.2), 0 0 20px rgba(205, 127, 50, 0.3)',
      };
    }
    return {};
  };

  const topRankStyle = rank <= 3 ? getTopRankStyling() : {};

  return (
    <div
      className={`flex items-center justify-between p-4 border-2 transition-all duration-500 relative ${
        isCurrentUser
          ? 'text-white bg-orange-400 border-[#d93900]/80 shadow-[0_0_15px_rgba(217,57,0,0.4)] my-2'
          : rank <= 3
            ? ''
            : 'text-white border-gray-400/60 hover:border-orange-400/60'
      } `}
      style={{
        fontFamily: 'monospace',
        clipPath:
          'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        transitionDelay: `${delay}ms`,
        ...topRankStyle,
        ...(isCurrentUser && {
          boxShadow: 'inset 0 0 10px rgba(217, 57, 0, 0.1), 0 0 15px rgba(217, 57, 0, 0.3)',
          background: '#ff8904',
          backdropFilter: 'blur(0px)', // Ensures proper layering
          zIndex: 10, // Ensure it stays above other content when sticky
        }),
      }}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div
            className={`font-bold text-lg truncate ${
              isCurrentUser
                ? 'text-[#d93900]'
                : rank === 1
                  ? 'text-yellow-600'
                  : rank === 2
                    ? 'text-gray-600'
                    : rank === 3
                      ? 'text-white'
                      : 'text-white'
            }`}
          >
            <span className="truncate" title={member}>
              {member}
            </span>
            {isCurrentUser && <span className="ml-2 text-sm text-white font-normal">(YOU)</span>}
          </div>
          {rankTitle && (
            <div
              className={`text-sm truncate font-bold tracking-wider ${rank <= 3 ? 'text-yellow-700' : isCurrentUser ? 'text-black' : 'text-orange-300'}`}
              title={rankTitle.label}
            >
              {rankTitle.label}
            </div>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
        <div
          className={`text-3xl font-black tracking-wider ${
            rank === 1
              ? 'text-yellow-500'
              : rank === 2
                ? 'text-gray-500'
                : rank === 3
                  ? 'text-orange-600'
                  : isCurrentUser
                    ? 'text-white/80'
                    : 'text-white/80'
          }`}
          style={{
            textShadow:
              rank === 1
                ? '1px 1px 0px #d97706, 2px 2px 0px #b45309'
                : rank === 2
                  ? '1px 1px 0px #6b7280, 2px 2px 0px #4b5563'
                  : rank === 3
                    ? '1px 1px 0px #ea580c, 2px 2px 0px #c2410c'
                    : isCurrentUser
                      ? '1px 1px 0px #b91c1c, 2px 2px 0px #ffe6e6'
                      : '1px 1px 0px #374151',
          }}
        >
          #{rank}
        </div>
        <div
          className={`text-xl font-bold font-mono ${
            isCurrentUser ? 'text-white/80' : rank <= 3 ? 'text-yellow-700' : 'text-white/80'
          }`}
        >
          {score.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export function LeaderboardModal({
  leaderboardData,
  isOpen,
  onClose,
  currentUserRank,
  currentUserName,
}: LeaderboardModalProps) {
  const [showEntries, setShowEntries] = useState(false);
  const currentUserRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCurrentUserVisible =
    currentUserName && leaderboardData.some((entry) => entry.member === currentUserName);
  const shouldShowFindMeButton = currentUserRank && !isCurrentUserVisible;

  useEffect(() => {
    if (isOpen) {
      setShowEntries(false);
      const timer = setTimeout(() => setShowEntries(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 h-screen"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-2 right-2">
        <X size={16} color="#d93900" />
      </button>
      <div
        ref={containerRef}
        className="bg-black/90 border-2 border-[#d93900]/60 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        style={{
          fontFamily: 'monospace',
          boxShadow: 'inset 0 0 20px rgba(217, 57, 0, 0.2), 0 0 30px rgba(217, 57, 0, 0.3)',
          clipPath:
            'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <div className="text-[#d95700] font-bold text-4xl tracking-wider mb-2">LEADERBOARD</div>
          <div className="text-orange-300 text-lg">Top {leaderboardData.length}</div>
        </div>

        <div className="">
          {leaderboardData.map((entry, index) => (
            <>
              <div
                key={`${entry.member}-${index}`}
                ref={currentUserName === entry.member ? currentUserRef : null}
                className={`${currentUserName === entry.member ? 'sticky -top-5 z-10' : ''}`}
              >
                <LeaderboardEntry
                  member={entry.member}
                  score={entry.score}
                  rank={index + 1}
                  isCurrentUser={currentUserName === entry.member}
                  delay={showEntries ? index * 50 : 0}
                />
              </div>
              {currentUserName === entry.member && (
                <div
                  key={`${entry.member}-${index}`}
                  ref={currentUserName === entry.member ? currentUserRef : null}
                  className={`${currentUserName === entry.member ? 'sticky -bottom-5 z-10' : ''}`}
                >
                  <LeaderboardEntry
                    member={entry.member}
                    score={entry.score}
                    rank={index + 1}
                    isCurrentUser={currentUserName === entry.member}
                    delay={showEntries ? index * 50 : 0}
                  />
                </div>
              )}
            </>
          ))}
        </div>

        {shouldShowFindMeButton && currentUserRank && currentUserRank > 1000 && (
          <div className="mt-6 pt-4 border-t border-[#d93900]/30">
            <div className="text-center text-gray-400 text-sm mb-3">YOUR POSITION</div>
            <LeaderboardEntry
              member={currentUserName || 'You'}
              score={0}
              rank={currentUserRank}
              isCurrentUser={true}
              delay={0}
            />
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={onClose}
            className="bg-[#d93900] hover:bg-[#d93900]/80 text-white font-bold px-8 py-4 text-lg border-2 border-[#d93900]/60 shadow-[0_0_20px_rgba(217,57,0,0.4)] transition-all"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 8px) 0, 100% 6px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { 
            box-shadow: inset 0 0 20px rgba(255, 215, 0, 0.2), 0 0 25px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.2);
          }
          50% { 
            box-shadow: inset 0 0 25px rgba(255, 215, 0, 0.3), 0 0 35px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
