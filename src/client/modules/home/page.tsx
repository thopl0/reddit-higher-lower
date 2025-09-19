'use client';

import { ArrowBigDown, ArrowBigUp, Flame, UsersIcon } from 'lucide-react';
import { BoltIcon } from 'lucide-react';
import { TrophyIcon } from 'lucide-react';
import { PlayIcon } from 'lucide-react';
import { Clock } from 'lucide-react';
import { useGame, useGameStats } from '../../providers/game-provider';
import { useNavigate } from 'react-router-dom';
import { useLeaderboard, useUserStat } from '../../providers/leaderboard-provider';
import { UserStats } from '../../components/user-stat';
import { useState } from 'react';
import { LeaderboardModal } from '../../components/leaderboard';

function Home() {
  const [showUserStats, setShowUserStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { state, startGame, clearError } = useGame();
  const { data: userStat, isLoading: isLoadingUserStat } = useUserStat();
  const { data: leaderboard } = useLeaderboard();

  const stats = useGameStats();
  const navigate = useNavigate();

  const handlePlayDaily = async () => {
    try {
      if (state.error) {
        clearError();
      }
      await startGame();

      if (state.hasActiveGame && !state.gameComplete) {
        navigate('/daily');
        return;
      }

      if (!state.error && state.gameStarted) {
        console.log('[v0] Game started successfully, ready to navigate');
      }
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleGoToDaily = () => {
    if (state.gameStarted && !state.error) {
      navigate('/daily');
    }
  };

  const getButtonContent = () => {
    if (state.isLoading) {
      return {
        text: 'STARTING...',
        disabled: true,
        icon: <BoltIcon className="w-6 h-6 animate-spin" />,
        onClick: handlePlayDaily,
      };
    }

    if (state.timeLeft !== null && state.timeLeft > 0) {
      const time = Math.floor(state.timeLeft / 1000);
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = time % 60;
      const timeString =
        hours > 0
          ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      return {
        text: `WAIT ${timeString}`,
        disabled: true,
        icon: <Clock className="w-6 h-6" />,
        onClick: handlePlayDaily,
      };
    }

    if (!state.canStartNewGame && state.hasActiveGame) {
      return {
        text: `CONTINUE: ${stats.currentRound} / ${stats.totalRounds}`,
        disabled: false,
        icon: <PlayIcon className="w-6 h-6" />,
        onClick: handleGoToDaily,
      };
    }

    if (state.gameStarted && !state.error && !state.gameComplete) {
      return {
        text: 'GO TO DAILY',
        disabled: false,
        icon: <PlayIcon className="w-6 h-6" />,
        onClick: handleGoToDaily,
      };
    }

    return {
      text: 'PLAY NOW',
      disabled: false,
      icon: <PlayIcon className="w-6 h-6" />,
      onClick: handlePlayDaily,
    };
  };

  const buttonContent = getButtonContent();

  return (
    <div className="relative z-10 flex items-center justify-center min-h-screen p-2 font-mono">
      <div className="relative max-w-md w-full">
        {state.error && !(state.timeLeft && state.timeLeft > 0) && (
          <div className="mb-4 p-4 bg-red-900 border-2 border-red-500 text-red-200 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold">{state.error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-300 ml-2">
                ×
              </button>
            </div>
          </div>
        )}

        {state.timeLeft !== null && state.timeLeft > 0 && (
          <div className="mb-4 p-4 bg-orange-900 border-2 border-orange-500 text-orange-200 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold">
                Cooldown:{' '}
                {(() => {
                  const hours = Math.floor(state.timeLeft / 3600);
                  const minutes = Math.floor((state.timeLeft % 3600) / 60);
                  const seconds = state.timeLeft % 60;
                  return hours > 0
                    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                })()}{' '}
                remaining
              </span>
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
          </div>
        )}

        <div
          className="relative bg-slate-900 border-4 border-orange-400 shadow-2xl"
          style={{
            clipPath:
              'polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))',
          }}
        >
          <div
            className="absolute inset-1 bg-gradient-to-br from-orange-500/20 via-red-500/10 to-orange-500/20"
            style={{
              clipPath:
                'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
          />

          <div className="relative p-4">
            <div className="text-center mb-8">
              <h1
                className="flex flex-col items-center justify-center text-4xl font-black text-white mb-2 tracking-wider drop-shadow-lg"
                style={{
                  textShadow: '2px 2px 0px #f97316, 4px 4px 0px #ea580c',
                }}
              >
                <p className="flex items-center gap-2">
                  <span>HIGHER </span>
                  <ArrowBigUp
                    size={32}
                    className="w-6 h-6 inline-block text-[#d93900]"
                    fill="#d93900"
                  />
                </p>
                <p className="flex items-center gap-2">
                  <ArrowBigDown
                    size={32}
                    className="w-6 h-6 inline-block text-[#6a5cff]"
                    fill="#6a5cff"
                  />
                  <span> LOWER</span>
                </p>
              </h1>
              <p className="text-orange-300 text-sm font-bold tracking-wide uppercase">
                &gt; Predict Upvotes • Dominate Leaderboard &lt;
              </p>
            </div>

            <div className="relative mb-8">
              <div
                className="bg-slate-800 border-4 border-orange-400 p-4 text-center relative"
                style={{
                  clipPath:
                    'polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))',
                }}
              >
                <div
                  className="absolute inset-2 bg-gradient-to-br from-orange-500/10 to-red-500/10"
                  style={{
                    clipPath:
                      'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))',
                  }}
                />

                <div className="relative">
                  <div className="flex gap-2 items-center justify-evenly">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-sm font-bold text-orange-300 uppercase tracking-widest">
                        SR
                      </span>
                      <div
                        className="text-5xl font-black text-orange-400 mb-4 tracking-wider"
                        style={{
                          textShadow: '2px 2px 0px #ea580c, 4px 4px 0px #c2410c',
                        }}
                      >
                        {isLoadingUserStat ? '...' : userStat?.elo ? userStat.elo : '800'}
                      </div>
                    </div>
                    <div className="border-2 h-full border-orange-400"></div>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-sm font-bold text-indigo-300 uppercase tracking-widest">
                        Rank
                      </span>
                      <div
                        className="text-5xl font-black text-indigo-400 mb-4 tracking-wider"
                        style={{
                          textShadow: '2px 2px 0px #6a5cff, 4px 4px 0px #594dd1',
                        }}
                      >
                        {isLoadingUserStat ? '...' : userStat ? `#${userStat.rank + 1}` : '0'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-2 py-1 left-0 w-full bg-orange-500 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 px-3 text-white">
                  <Flame fill="#ea580c" className="w-4 h-4 text-white" />
                  <span className="text-sm font-bold text-white">
                    {userStat?.streak || 0} STREAK
                  </span>
                </div>
              </div>
            </div>

            <button
              className="group relative w-full mb-8 overflow-hidden cursor-pointer"
              onClick={buttonContent.onClick}
              disabled={buttonContent.disabled}
            >
              <div
                className={`
              bg-gradient-to-r from-orange-500 to-red-500 
              hover:from-yellow-400 hover:via-orange-400 hover:to-red-500
              border-4 border-orange-300 hover:border-yellow-200
              transition-all duration-300 ease-out
              hover:shadow-[0_0_20px_rgba(255,165,0,0.6),0_0_40px_rgba(255,69,0,0.4),0_0_60px_rgba(255,0,0,0.2)]
              ${buttonContent.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                style={{
                  clipPath:
                    'polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px))',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/60 via-orange-400/80 to-red-500/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-full group-hover:animate-[blazeWave1_1.2s_ease-out_infinite]" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/40 via-yellow-400/60 to-orange-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:animate-[blazeWave2_1.8s_ease-in-out_infinite]" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-300/30 via-red-400/50 to-yellow-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-x-full group-hover:animate-[blazeWave3_2.2s_ease-out_infinite]" />

                <div className="py-6 px-6 relative z-10">
                  <div className="flex items-center justify-center gap-4 text-white font-black text-xl tracking-wider group-hover:text-yellow-100 transition-colors duration-300">
                    <span className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,0,0.8)] group-hover:animate-[textPulse_0.8s_ease-in-out_infinite_alternate] transition-all duration-300">
                      {buttonContent.text}
                    </span>
                  </div>
                </div>

                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute top-2 left-4 w-1 h-1 bg-yellow-400 group-hover:animate-[sparkDance_1.5s_ease-in-out_infinite]" />
                  <div className="absolute top-3 right-6 w-1 h-1 bg-orange-400 group-hover:animate-[sparkDance_2s_ease-in-out_infinite_reverse] delay-200" />
                  <div className="absolute bottom-3 left-8 w-1 h-1 bg-red-400 group-hover:animate-[sparkDance_1.8s_ease-in-out_infinite] delay-400" />
                  <div className="absolute bottom-2 right-4 w-1 h-1 bg-yellow-300 group-hover:animate-[sparkDance_2.2s_ease-in-out_infinite_reverse] delay-600" />
                  <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-orange-300 group-hover:animate-[sparkDance_1.3s_ease-in-out_infinite] delay-100" />
                  <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-red-300 group-hover:animate-[sparkDance_1.7s_ease-in-out_infinite_reverse] delay-300" />
                </div>
              </div>
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowLeaderboard(true);
                  setShowUserStats(false);
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 border-2 border-orange-400 hover:border-orange-300 py-3 px-4 transition-all duration-200"
                style={{
                  clipPath:
                    'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))',
                }}
              >
                <div className="flex items-center justify-center gap-2 text-orange-300 font-bold text-sm">
                  <TrophyIcon className="w-4 h-4" />
                  <span>RANKS</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowUserStats(true);
                  setShowLeaderboard(false);
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 border-2 border-orange-400 hover:border-orange-300 py-3 px-4 transition-all duration-200"
                style={{
                  clipPath:
                    'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))',
                }}
              >
                <div className="flex items-center justify-center gap-2 text-orange-300 font-bold text-sm">
                  <UsersIcon className="w-4 h-4" />
                  <span>STATS</span>
                </div>
              </button>

              {/* <button
                onClick={handleSettings}
                className="flex-1 bg-slate-700 hover:bg-slate-600 border-2 border-orange-400 hover:border-orange-300 py-3 px-4 transition-all duration-200"
                style={{
                  clipPath:
                    'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))',
                }}
              >
                <div className="flex items-center justify-center gap-2 text-orange-300 font-bold text-sm">
                  <Cog6ToothIcon className="w-4 h-4" />
                  <span>CONFIG</span>
                </div>
              </button> */}
            </div>

            {/* <div className="absolute top-4 right-4 flex gap-2">
              <div
                className={`w-3 h-3 border ${state.isLoading ? 'bg-yellow-400 border-yellow-300' : 'bg-green-400 border-green-300'} animate-pulse`}
              />
              <div
                className={`w-3 h-3 border ${state.error ? 'bg-red-400 border-red-300' : 'bg-orange-400 border-orange-300'} animate-pulse`}
                style={{ animationDelay: '0.5s' }}
              />
            </div> */}
          </div>
        </div>
      </div>

      {showUserStats && (
        <UserStats
          username={userStat?.username || 'PLAYER STATS'}
          correctGuesses={userStat?.correctGuesses || 0}
          incorrectGuesses={userStat?.incorrectGuesses || 0}
          streak={userStat?.streak || 0}
          gamesPlayed={userStat?.gamesPlayed || 0}
          elo={userStat?.elo || 0}
          rank={userStat?.rank || 0}
          score={userStat?.score || 0}
          isOpen={showUserStats}
          onClose={() => setShowUserStats(false)}
          className={`absolute ${showUserStats ? 'block' : 'hidden'}`}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          leaderboardData={leaderboard}
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
          currentUserRank={userStat?.rank || 0}
          currentUserName={userStat?.username || ''}
        />
      )}
    </div>
  );
}

export default Home;
