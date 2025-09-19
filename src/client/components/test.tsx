'use client';

import { useState, useEffect } from 'react';
import { useGetHotPosts } from '../modules/posts/queries/get-hot-posts';
import type { RedditPost } from '../types/post';
import { PostCard } from './post-card';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { RefreshCw, Play, ArrowUp, ArrowDown, Trophy, Calendar } from 'lucide-react';

type GameState = 'waiting' | 'playing' | 'revealed' | 'dailyComplete';

const fallBackPost: RedditPost = {
  id: 'fallback',
  authorId: 'unknown',
  authorName: 'unknown',
  subredditId: 'unknown',
  subredditName: 'unknown',
  permalink: '',
  title: 'Fallback Post',
  body: '',
  url: '',
  thumbnail: {
    url: '',
    height: 0,
    width: 0,
  },
  score: 0,
  numberOfComments: 0,
  numberOfReports: 0,
  createdAt: new Date().toISOString(),
  approved: false,
  spam: false,
  stickied: false,
  removed: false,
  archived: false,
  edited: false,
  locked: false,
  nsfw: false,
  quarantined: false,
  spoiler: false,
  hidden: false,
  ignoringReports: false,
  flair: {
    backgroundColor: '',
    type: '',
    richtext: [],
    textColor: '',
  },
  modReportReasons: [],
  userReportReasons: [],
};

export function RedditHigherLowerGame() {
  const { data: posts, isLoading, error, refetch } = useGetHotPosts();
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [basePost, setBasePost] = useState<RedditPost | null>(null);
  const [comparisonPost, setComparisonPost] = useState<RedditPost | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [lastGuessCorrect, setLastGuessCorrect] = useState<boolean | null>(null);
  const [userGuess, setUserGuess] = useState<'higher' | 'lower' | null>(null);
  const [dailyPlayed, setDailyPlayed] = useState(false);
  const [gameProgress, setGameProgress] = useState<Array<boolean | null>>([
    null,
    null,
    null,
    null,
    null,
  ]); // Track progress for each round

  useEffect(() => {
    const today = new Date().toDateString();
    const lastPlayed = localStorage.getItem('reddit-game-last-played');
    if (lastPlayed === today) {
      setDailyPlayed(true);
      setGameState('dailyComplete');
    }
  }, []);

  const getRandomPost = (postList: RedditPost[], exclude?: RedditPost): RedditPost => {
    const availablePosts = exclude ? postList.filter((p) => p.id !== exclude.id) : postList;
    const randomIndex = Math.floor(Math.random() * availablePosts.length);
    return availablePosts[randomIndex] || fallBackPost;
  };

  const makeGuess = (guess: 'higher' | 'lower') => {
    if (!basePost || !comparisonPost || gameState !== 'playing') return;

    setUserGuess(guess);

    const actuallyHigher = comparisonPost.score > basePost.score;
    const correct =
      (guess === 'higher' && actuallyHigher) || (guess === 'lower' && !actuallyHigher);

    setLastGuessCorrect(correct);

    const newProgress = [...gameProgress];
    newProgress[totalGuesses] = correct;
    setGameProgress(newProgress);

    setTotalGuesses((prev) => prev + 1);

    if (correct) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    setGameState('revealed');

    if (totalGuesses >= 4) {
      const today = new Date().toDateString();
      localStorage.setItem('reddit-game-last-played', today);
      setTimeout(() => {
        setDailyPlayed(true);
        setGameState('dailyComplete');
      }, 3000);
    }
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setTotalGuesses(0);
    setGameProgress([null, null, null, null, null]); // Reset progress tracker
    setGameState('waiting');
    setBasePost(null);
    setComparisonPost(null);
    setLastGuessCorrect(null);
    setUserGuess(null);
    setDailyPlayed(false);
    localStorage.removeItem('reddit-game-last-played');
  };

  const startNewRound = () => {
    if (posts && posts.length >= 2) {
      const newBase =
        gameState === 'revealed' && comparisonPost ? comparisonPost : getRandomPost(posts);
      const newComparison = getRandomPost(posts, newBase);

      setBasePost(newBase);
      setComparisonPost(newComparison);
      setGameState('playing');
      setLastGuessCorrect(null);
      setUserGuess(null);
    }
  };

  useEffect(() => {
    if (posts && posts.length >= 2 && gameState === 'waiting') {
      startNewRound();
    }
  }, [posts, gameState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading hot posts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">Failed to load posts</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'dailyComplete') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Daily Challenge Complete!</h2>
              <p className="text-muted-foreground mb-4">
                You've completed today's Reddit Higher or Lower challenge.
              </p>
              <div className="bg-muted rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                <p className="text-3xl font-bold text-primary">{score}/5</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Come back tomorrow for a new challenge!</span>
              </div>
            </div>
            <Button onClick={resetGame} variant="outline" className="w-full bg-transparent">
              Play Again (Reset Progress)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!posts || posts.length < 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Not enough posts to play</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {' '}
        {/* Smaller padding on mobile */}
        <div className="text-center mb-6 sm:mb-8">
          {' '}
          {/* Smaller margin on mobile */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center">
              {' '}
              {/* Smaller icon on mobile */}
              <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Reddit Higher or Lower
              </h1>{' '}
              {/* Responsive text sizes */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Daily Challenge • Round {totalGuesses + 1}/5</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            {gameProgress.map((result, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    result === true
                      ? 'bg-[#ff4500] border-[#ff4500] text-white'
                      : result === false
                        ? 'bg-[#523DFF] border-[#523DFF] text-white'
                        : index === totalGuesses
                          ? 'border-primary bg-primary/10'
                          : 'border-muted bg-muted/30'
                  }`}
                >
                  {result === true ? (
                    <ArrowUp className="w-3 h-3" strokeWidth={2} />
                  ) : result === false ? (
                    <ArrowDown className="w-3 h-3" strokeWidth={2} />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                {index < 4 && (
                  <div
                    className={`w-4 h-0.5 ${index < totalGuesses ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto">
            {' '}
            {/* Responsive text size */}
            Will the next post have more or fewer upvotes? Use ↑ for higher, ↓ for lower.
          </p>
        </div>
        <div className="hidden md:flex justify-center mb-4 sm:mb-6">
          {' '}
          {/* Smaller margin on mobile */}
          <div className="flex items-center gap-4 sm:gap-6 bg-muted/30 rounded-full px-4 sm:px-6 py-2 sm:py-3">
            {' '}
            {/* Smaller padding on mobile */}
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-foreground">{score}</div>{' '}
              {/* Smaller text on mobile */}
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-base sm:text-lg font-bold text-primary">{streak}</div>{' '}
              {/* Smaller text on mobile */}
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
          </div>
        </div>
        {basePost && comparisonPost && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {' '}
            {/* Use grid layout for better mobile/desktop experience */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-center text-foreground">
                {' '}
                {/* Smaller text on mobile */}
                {gameState === 'playing' ? 'Current Post' : 'Previous Post'}
              </h2>
              <PostCard post={basePost} showScore={true} isBaseCard={true} disabled={true} />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-center text-foreground">
                {' '}
                {/* Smaller text on mobile */}
                {gameState === 'playing' ? 'Next Post - Higher or Lower?' : 'Next Post'}
              </h2>
              <PostCard
                post={comparisonPost}
                showScore={gameState === 'revealed'}
                onUpvote={() => makeGuess('higher')}
                onDownvote={() => makeGuess('lower')}
                disabled={gameState === 'revealed'}
                isSelected={userGuess !== null}
                isCorrect={gameState === 'revealed' ? lastGuessCorrect : null}
              />
            </div>
          </div>
        )}
        {gameState === 'playing' && (
          <div className="text-center mb-4 sm:mb-6">
            {' '}
            {/* Smaller margin on mobile */}
            <p className="text-xs sm:text-sm text-muted-foreground">
              Click ↑ if you think it has more upvotes, ↓ if fewer
            </p>
          </div>
        )}
        {gameState === 'revealed' && (
          <div className="text-center space-y-4 mb-6 sm:mb-8">
            {' '}
            {/* Smaller margin on mobile */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border">
              {lastGuessCorrect ? (
                <>
                  <ArrowUp className="w-4 h-4 text-[#ff4500]" />{' '}
                  {/* Use Reddit orange for correct */}
                  <span className="font-medium text-[#ff4500]">Correct!</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-4 h-4 text-[#523DFF]" /> {/* Use purple for incorrect */}
                  <span className="font-medium text-[#523DFF]">Wrong!</span>
                </>
              )}
            </div>
            {totalGuesses < 5 && (
              <Button
                onClick={startNewRound}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Play className="w-4 h-4 mr-2" />
                Next Round
              </Button>
            )}
          </div>
        )}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={resetGame}
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Game
          </Button>
        </div>
      </div>
    </div>
  );
}
