// App.tsx
import Home from './modules/home/page';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DailyGame from './modules/daily/page';
import BackGround from './components/background';
import { GameProvider } from './providers/game-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LeaderboardProvider } from './providers/leaderboard-provider';
import { useEffect } from 'react';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    fetch('/api/init', {
      method: 'GET',
      credentials: 'include',
    });
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <BackGround>
        <GameProvider>
          <LeaderboardProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/daily" element={<DailyGame />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </BrowserRouter>
          </LeaderboardProvider>
        </GameProvider>
      </BackGround>
    </QueryClientProvider>
  );
}
