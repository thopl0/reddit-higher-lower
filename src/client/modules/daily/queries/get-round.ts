import { useQuery } from '@tanstack/react-query';
import { ApiResponse, GameResult } from '../../../../shared/types/api';

export function useGetRound() {
  return useQuery<ApiResponse<GameResult>, ApiResponse>({
    queryKey: ['round'],
    queryFn: async () => {
      const res = await fetch('/api/game/round', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });
}
