'use client';

import type React from 'react';

import { useState } from 'react';
import type { Post } from '../../shared/types/api';
import { navigateTo } from '@devvit/web/client';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';

interface PostCardProps {
  post: Post;
  showScore?: boolean;
  baseCardScore: number;
  onUpvote?: (() => void) | (() => Promise<void>) | undefined;
  onDownvote?: (() => void) | (() => Promise<void>) | undefined;
  disabled?: boolean;
  isSelected?: boolean;
  isCorrect?: boolean | null;
  isBaseCard?: boolean;
  selectedChoice?: 'higher' | 'lower' | null;
}

export function PostCard({
  post,
  showScore = false,
  baseCardScore,
  onUpvote,
  onDownvote,
  disabled = false,
  isSelected = false,
  isCorrect = null,
  isBaseCard = false,
  selectedChoice = null,
}: PostCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  console.log(post.url, post.url.split('.')[post.url.split('.').length - 1]);

  // Determine card styling based on state - UPDATED COLOR SCHEME
  const getCardStyling = () => {
    if (isSelected && isCorrect !== null) {
      if (isCorrect) {
        // Correct answer - reddish upvote color (like Reddit upvote)
        return 'border-red-400 bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-[1.02]';
      } else {
        // Incorrect answer - bluish downvote color (like Reddit downvote)
        return 'border-blue-400 bg-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.5)]';
      }
    }

    if (isSelected || selectedChoice) {
      return 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(255,69,0,0.3)]';
    }

    if (isBaseCard) {
      return 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,255,255,0.2)]';
    }

    if (disabled) {
      return 'border-gray-600 bg-gray-900/50 opacity-90';
    }

    return 'border-gray-600 bg-gray-900/50 hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(255,69,0,0.2)]';
  };

  // Get button styling - UPDATED COLOR SCHEME
  const getUpvoteButtonStyling = () => {
    if (selectedChoice === 'higher') {
      if (isCorrect === true) {
        // Correct choice - reddish upvote style
        return 'text-orange-300 bg-orange-500/40 shadow-[0_0_15px_rgba(239,68,68,0.6)] border-orange-400';
      } else if (isCorrect === false) {
        // Incorrect choice - bluish downvote style
        return 'text-blue-300 bg-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.6)] border-blue-400';
      }
      // Still processing
      return 'text-orange-400 bg-orange-500/40 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-orange-400';
    }
    if (disabled) {
      return 'text-gray-400 border-gray-600 cursor-not-allowed';
    }
    return 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/20 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:border-orange-400';
  };

  const getDownvoteButtonStyling = () => {
    if (selectedChoice === 'lower') {
      if (isCorrect === true) {
        // Correct choice - reddish upvote style
        return 'text-indigo-300 bg-indigo-500/40 shadow-[0_0_15px_rgba(59,130,246,0.6)] border-indigo-400 fill-indigo-400';
      } else if (isCorrect === false) {
        // Incorrect choice - bluish downvote style
        return 'text-indigo-300 bg-indigo-500/40 shadow-[0_0_15px_rgba(59,130,246,0.6)] border-indigo-400';
      }
      // Still processing
      return 'text-indigo-400 bg-indigo-500/40 shadow-[0_0_15px_rgba(59,130,246,0.6)] border-indigo-400';
    }
    if (disabled) {
      return 'text-gray-400 border-gray-600 cursor-not-allowed';
    }
    return 'text-gray-400 hover:text-indigo-300 hover:bg-indigo-500/20 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:border-indigo-400';
  };

  const handleUpvoteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onUpvote) {
      const result = onUpvote();
      if (result instanceof Promise) {
        await result;
      }
    }
  };

  const handleDownvoteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onDownvote) {
      const result = onDownvote();
      if (result instanceof Promise) {
        await result;
      }
    }
  };

  return (
    <>
      <div className="max-w-full mx-auto">
        <div
          className={`transition-all duration-300 border-2 bg-black/80 font-mono ${getCardStyling()}`}
          style={{
            clipPath:
              'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
          }}
        >
          <div className="p-1">
            <div className="flex bg-black/40 border border-gray-700">
              <div className="flex-1">
                {post.thumbnail?.url &&
                post.thumbnail.url !== 'self' &&
                post.thumbnail.url !== 'default' ? (
                  <div
                    className="relative w-full overflow-hidden border-b border-gray-700 cursor-pointer group"
                    onClick={() => !disabled && setShowImageModal(true)}
                    style={{ aspectRatio: '16/9' }}
                  >
                    <img
                      src={
                        ([
                          'jpeg',
                          'jpg',
                          'png',
                          'gif',
                          'webp',
                          'svg',
                          'bmp',
                          'ico',
                          'tiff',
                        ].includes(post.url.split('.')[post.url.split('.').length - 1] || '')
                          ? post.url
                          : post.thumbnail?.url) || '/placeholder.svg'
                      }
                      alt="Post thumbnail"
                      className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30 group-hover:bg-black/40 transition-all duration-300"></div>
                    {!disabled && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div
                          className="bg-black/90 border-2 border-orange-500 px-2 sm:px-4 py-1 sm:py-2 text-orange-300 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,69,0,0.5)]"
                          style={{
                            clipPath:
                              'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
                          }}
                        >
                          🔍 <span className="hidden sm:inline">CLICK TO EXPAND</span>
                          <span className="sm:hidden">EXPAND</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 bg-gray-900/50 border-b border-gray-700 min-h-[8rem] sm:min-h-[10rem] flex items-center">
                    <p className="text-xs sm:text-sm text-gray-300 font-mono leading-relaxed line-clamp-4">
                      {post.body ||
                        'This post contains text content. Click to view the full discussion on Reddit.'}
                    </p>
                  </div>
                )}

                <div className="p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-400 flex-wrap">
                    <div className="bg-orange-500/30 border border-orange-500/70 px-1.5 sm:px-2 py-0.5 sm:py-1 text-orange-200 font-bold text-xs">
                      r/{post.subredditName}
                    </div>
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <span className="truncate text-xs">u/{post.authorName}</span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm lg:text-base leading-snug text-white font-mono min-h-[2rem] sm:min-h-[2.5rem] flex items-center line-clamp-2 sm:line-clamp-3">
                    {post.title}
                  </h3>

                  <div className="flex items-center justify-between pt-2 sm:pt-3">
                    <div className="flex items-center bg-black/80 border-2 border-gray-600 p-0.5 sm:p-1">
                      {/* Upvote Button */}
                      <button
                        className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 transition-all duration-300 font-bold text-sm sm:text-lg lg:text-xl border-r border-2 ${getUpvoteButtonStyling()}`}
                        onClick={handleUpvoteClick}
                        disabled={disabled}
                      >
                        <ArrowBigUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 hover:fill-orange-500" />
                      </button>

                      {/* Score Display */}
                      <div className="text-xs sm:text-sm font-bold text-center py-1.5 sm:py-2 px-2 sm:px-3 lg:px-4 min-w-[2.5rem] sm:min-w-[3rem] lg:min-w-[4rem] bg-black/60">
                        {showScore || isBaseCard ? (
                          <span className="text-white font-mono">
                            {post.score > 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm sm:text-base lg:text-lg">???</span>
                        )}
                      </div>

                      {/* Downvote Button */}
                      <button
                        className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 transition-all duration-300 font-bold text-sm sm:text-lg lg:text-xl border-l border-2 ${getDownvoteButtonStyling()}`}
                        onClick={handleDownvoteClick}
                        disabled={disabled}
                      >
                        <ArrowBigDown className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 hover:fill-indigo-500" />
                      </button>
                    </div>

                    {(showScore || isBaseCard) && (
                      <button
                        className="bg-cyan-500/30 border-2 border-cyan-500/70 text-cyan-200 px-1.5 sm:px-2 lg:px-3 py-1 sm:py-2 text-xs font-bold hover:bg-cyan-500/40 transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `https://www.reddit.com/r/${post.subredditName}/comments/${post.id}`,
                            '_blank'
                          );
                        }}
                      >
                        <span className="hidden sm:inline">VIEW ON REDDIT</span>
                        <span className="sm:hidden">REDDIT</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isBaseCard && isCorrect === true && (
          <div className="mt-3 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg backdrop-blur-sm">
            <div className="text-orange-300 text-xs sm:text-sm font-mono text-center">
              <span className="font-bold text-orange-400">CORRECT!</span> This post has{' '}
              <span className="font-bold text-white">
                {post.score - baseCardScore > 1000
                  ? `${((post.score - baseCardScore) / 1000).toFixed(1)}k`
                  : post.score - baseCardScore}
              </span>{' '}
              more upvotes.
            </div>
          </div>
        )}

        {!isBaseCard && isCorrect === false && (
          <div className="mt-3 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg backdrop-blur-sm">
            <div className="text-indigo-300 text-xs sm:text-sm font-mono text-center">
              <span className="font-bold text-indigo-400">INCORRECT!</span> This post has{' '}
              <span className="font-bold text-white">
                {baseCardScore - post.score > 1000
                  ? `${((baseCardScore - post.score) / 1000).toFixed(1)}k`
                  : baseCardScore - post.score}
              </span>{' '}
              less upvotes.
            </div>
          </div>
        )}

        {showImageModal && post.thumbnail?.url && (
          <div
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-6xl max-h-[95vh] w-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-2 sm:mb-4 px-2 gap-2">
                <div
                  className="bg-black/90 border-2 border-cyan-500/70 px-2 sm:px-4 py-1 sm:py-2 text-cyan-300 font-mono text-xs sm:text-sm shadow-[0_0_15px_rgba(0,255,255,0.3)] w-full sm:w-auto text-center"
                  style={{
                    clipPath:
                      'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
                  }}
                >
                  <span className="hidden sm:inline">ESC or CLICK OUTSIDE to close</span>
                  <span className="sm:hidden">TAP OUTSIDE to close</span>
                </div>
                <button
                  className="bg-red-600/90 border-2 border-red-500 text-white px-3 sm:px-6 py-1 sm:py-2 font-mono text-xs sm:text-sm font-bold hover:bg-red-700 transition-all duration-200 shadow-[0_0_20px_rgba(220,38,127,0.4)] hover:shadow-[0_0_30px_rgba(220,38,127,0.6)]"
                  onClick={() => setShowImageModal(false)}
                  style={{
                    clipPath:
                      'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
                  }}
                >
                  ✕ CLOSE
                </button>
              </div>

              <div
                className="bg-black/90 border-2 border-orange-500/70 p-1 sm:p-2 shadow-[0_0_40px_rgba(255,69,0,0.3)] flex-1 flex items-center justify-center"
                style={{
                  clipPath:
                    'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                }}
              >
                <img
                  src={
                    ([
                      '.jpeg',
                      '.jpg',
                      '.png',
                      '.gif',
                      '.webp',
                      '.svg',
                      '.bmp',
                      '.ico',
                      '.tiff',
                    ].includes(post.url.split('.')[post.url.split('.').length - 1] || '')
                      ? post.url
                      : post.thumbnail?.url) || '/placeholder.svg'
                  }
                  alt="Full size post image"
                  className="max-w-full max-h-full object-contain border border-gray-600"
                  style={{ imageRendering: 'pixelated' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div
                className="mt-2 sm:mt-4 bg-black/90 border-2 border-gray-600/70 p-2 sm:p-4 text-center shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                style={{
                  clipPath:
                    'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
                }}
              >
                <div className="text-gray-300 font-mono text-xs sm:text-sm">
                  <span className="text-orange-400 font-bold">IMAGE:</span>{' '}
                  <span className="line-clamp-2">{post.title}</span>
                </div>
                <div className="text-gray-500 font-mono text-xs mt-1">
                  <span className="text-cyan-400">r/{post.subredditName}</span> •{' '}
                  <span className="text-gray-400">u/{post.authorName}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
